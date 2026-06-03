import "dotenv/config";
import { once } from "node:events";
import amqp from "amqplib";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://app:app123@localhost:5672";
const EXCHANGE = process.env.RABBITMQ_EXCHANGE || "enrollment.events";
const EXCHANGE_TYPE = process.env.RABBITMQ_EXCHANGE_TYPE || "topic";
const CONNECT_RETRY_DELAY_MS = Number(
  process.env.RABBITMQ_CONNECT_RETRY_DELAY_MS || 2000
);

let connection = null;
let channel = null;
let connecting = null;

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
      console.error("[rabbitmq-publisher] connect failed:", error.message);
      await sleep(CONNECT_RETRY_DELAY_MS);
    }
  }
}

export async function connectRabbitMQPublisher() {
  if (channel) {
    return channel;
  }

  if (connecting) {
    return connecting;
  }

  connecting = (async () => {
    connection = await connectWithRetry();

    connection.on("error", (error) => {
      console.error("[rabbitmq-publisher] connection error:", error.message);
    });

    connection.on("close", () => {
      console.error("[rabbitmq-publisher] connection closed");
      connection = null;
      channel = null;
      connecting = null;
    });

    channel = await connection.createConfirmChannel();

    await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, {
      durable: true
    });

    console.log(`[rabbitmq-publisher] connected. exchange=${EXCHANGE}`);
    return channel;
  })();

  return connecting;
}

export async function publishIntegrationEvent({ routingKey, event }) {
  const ch = await connectRabbitMQPublisher();
  const buffer = Buffer.from(JSON.stringify(event), "utf8");

  const ok = ch.publish(EXCHANGE, routingKey, buffer, {
    persistent: true,
    contentType: "application/json",
    messageId: event.eventId,
    type: event.eventType,
    timestamp: Math.floor(Date.now() / 1000),
    headers: {
      eventId: event.eventId,
      eventType: event.eventType,
      version: event.version,
      correlationId: event.correlationId || ""
    }
  });

  if (!ok) {
    await once(ch, "drain");
  }

  await ch.waitForConfirms();
}

export async function closeRabbitMQPublisher() {
  if (channel) {
    await channel.close();
  }

  if (connection) {
    await connection.close();
  }

  channel = null;
  connection = null;
  connecting = null;
}
