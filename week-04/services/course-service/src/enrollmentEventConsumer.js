import "dotenv/config";
import amqp from "amqplib";

import { db } from "./db.js";
import { createCourseRepository } from "./courseRepository.js";
import { createCourseService } from "./courseService.js";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://app:app123@localhost:5672";
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || "enrollment.events";
const EXCHANGE_TYPE = process.env.RABBITMQ_EXCHANGE_TYPE || "topic";
const DLX = process.env.RABBITMQ_DLX || "enrollment.dlx";
const QUEUE =
  process.env.COURSE_ENROLLMENT_QUEUE ||
  "course.enrollment.confirmed.queue";
const DLQ =
  process.env.COURSE_ENROLLMENT_DLQ || "course.enrollment.confirmed.dlq";
const ROUTING_KEY =
  process.env.COURSE_ENROLLMENT_ROUTING_KEY || "enrollment.confirmed";
const DLQ_ROUTING_KEY =
  process.env.COURSE_ENROLLMENT_DLQ_ROUTING_KEY ||
  "course.enrollment.confirmed.dead";
const MAX_RETRIES = Number(process.env.COURSE_EVENT_MAX_RETRIES || 3);
const RETRY_DELAY_MS = Number(process.env.COURSE_EVENT_RETRY_DELAY_MS || 3000);
const PREFETCH = Number(process.env.RABBITMQ_PREFETCH || 1);
const CONNECT_RETRY_DELAY_MS = Number(
  process.env.RABBITMQ_CONNECT_RETRY_DELAY_MS || 2000
);

const courseService = createCourseService(createCourseRepository(db));

let connection = null;
let channel = null;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function connectWithRetry() {
  for (;;) {
    try {
      return await amqp.connect(RABBITMQ_URL);
    } catch (error) {
      console.error("[course-consumer] connect failed:", error.message);
      await sleep(CONNECT_RETRY_DELAY_MS);
    }
  }
}

async function assertTopology(ch) {
  await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await ch.assertExchange(DLX, "direct", { durable: true });

  await ch.assertQueue(DLQ, { durable: true });
  await ch.bindQueue(DLQ, DLX, DLQ_ROUTING_KEY);

  await ch.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": DLX,
      "x-dead-letter-routing-key": DLQ_ROUTING_KEY
    }
  });

  await ch.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
  await ch.prefetch(PREFETCH);
}

function parseEvent(message) {
  return JSON.parse(message.content.toString("utf8"));
}

function retryCount(message) {
  return Number(message.properties.headers?.["x-retry-count"] || 0);
}

async function publishRetry(message, nextRetryCount) {
  await sleep(RETRY_DELAY_MS);

  channel.publish(EXCHANGE, message.fields.routingKey, message.content, {
    persistent: true,
    contentType: message.properties.contentType || "application/json",
    messageId: message.properties.messageId,
    type: message.properties.type,
    timestamp: Math.floor(Date.now() / 1000),
    headers: {
      ...(message.properties.headers || {}),
      "x-retry-count": nextRetryCount
    }
  });
}

function publishDeadLetter(message, error) {
  channel.publish(DLX, DLQ_ROUTING_KEY, message.content, {
    persistent: true,
    contentType: message.properties.contentType || "application/json",
    messageId: message.properties.messageId,
    type: message.properties.type,
    timestamp: Math.floor(Date.now() / 1000),
    headers: {
      ...(message.properties.headers || {}),
      "x-error": String(error?.message || error).slice(0, 1000)
    }
  });
}

async function handleMessage(message) {
  if (!message) {
    return;
  }

  try {
    const event = parseEvent(message);
    await courseService.applyEnrollmentConfirmed(event);
    channel.ack(message);
    console.log(`[course-consumer] applied eventId=${event.eventId}`);
  } catch (error) {
    const currentRetryCount = retryCount(message);

    if (currentRetryCount < MAX_RETRIES) {
      const nextRetryCount = currentRetryCount + 1;
      console.error(
        `[course-consumer] retry ${nextRetryCount}/${MAX_RETRIES}:`,
        error.message
      );
      await publishRetry(message, nextRetryCount);
      channel.ack(message);
      return;
    }

    console.error("[course-consumer] dead-lettered:", error.message);
    publishDeadLetter(message, error);
    channel.ack(message);
  }
}

async function start() {
  connection = await connectWithRetry();

  connection.on("error", (error) => {
    console.error("[course-consumer] connection error:", error.message);
  });

  connection.on("close", () => {
    console.error("[course-consumer] connection closed");
  });

  channel = await connection.createChannel();
  await assertTopology(channel);

  await channel.consume(QUEUE, handleMessage, {
    noAck: false
  });

  console.log(`[course-consumer] listening queue=${QUEUE}`);
}

async function shutdown() {
  if (channel) {
    await channel.close();
  }

  if (connection) {
    await connection.close();
  }

  await db.destroy();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch(async (error) => {
  console.error("[course-consumer] fatal error:", error);
  await db.destroy();
  process.exit(1);
});
