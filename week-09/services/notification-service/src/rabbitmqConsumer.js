import "dotenv/config";
import amqp from "amqplib";

import {
  claimEvent,
  closeEventDeduplicator,
  releaseEvent
} from "./eventDeduplicator.js";
import { handleCourseEnrollmentCountIncreased } from "./notificationService.js";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://app:app123@localhost:5672";
const EXCHANGE = process.env.COURSE_EVENTS_EXCHANGE || "course.events";
const EXCHANGE_TYPE = process.env.COURSE_EVENTS_EXCHANGE_TYPE || "topic";
const QUEUE =
  process.env.NOTIFICATION_QUEUE ||
  "notification.course.enrolled_count.increased.queue";
const ROUTING_KEY =
  process.env.COURSE_EVENT_ROUTING_KEY || "course.enrolled_count.increased";
const PREFETCH = Number(process.env.RABBITMQ_PREFETCH || 1);
const CONNECT_RETRY_DELAY_MS = Number(
  process.env.RABBITMQ_CONNECT_RETRY_DELAY_MS || 2000
);

let connection = null;
let channel = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry() {
  for (;;) {
    try {
      return await amqp.connect(RABBITMQ_URL);
    } catch (error) {
      console.error("[notification-consumer] connect failed:", error.message);
      await sleep(CONNECT_RETRY_DELAY_MS);
    }
  }
}

function parseEvent(message) {
  return JSON.parse(message.content.toString("utf8"));
}

async function setupTopology() {
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
}

async function handleMessage(message) {
  if (!message) return;

  const event = parseEvent(message);
  const eventId = event.eventId || message.properties.messageId;
  const claimed = await claimEvent(eventId);

  if (!claimed) {
    console.log(`[notification-consumer] skipped duplicate eventId=${eventId}`);
    channel.ack(message);
    return;
  }

  try {
    await handleCourseEnrollmentCountIncreased(event);
    channel.ack(message);
  } catch (error) {
    await releaseEvent(eventId);
    console.error("[notification-consumer] failed:", error.message);
    channel.nack(message, false, false);
  }
}

export async function startNotificationConsumer() {
  connection = await connectWithRetry();
  connection.on("error", (error) => {
    console.error("[notification-consumer] connection error:", error.message);
  });
  connection.on("close", () => {
    console.error("[notification-consumer] connection closed");
  });

  channel = await connection.createChannel();
  await setupTopology();
  await channel.prefetch(PREFETCH);
  await channel.consume(QUEUE, handleMessage, { noAck: false });
  console.log(`[notification-consumer] waiting queue=${QUEUE}`);
}

export async function closeNotificationConsumer() {
  if (channel) await channel.close();
  if (connection) await connection.close();
  await closeEventDeduplicator();
  channel = null;
  connection = null;
}