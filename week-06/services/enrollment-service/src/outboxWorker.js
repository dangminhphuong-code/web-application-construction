import "dotenv/config";
import {
  markOutboxEventFailed,
  markOutboxEventPublished,
  reservePendingOutboxEvents,
  resetStuckPublishingEvents
} from "./outboxEventRepository.js";
import {
  closeRabbitMQPublisher,
  connectRabbitMQPublisher,
  publishIntegrationEvent
} from "./rabbitmqPublisher.js";
import { db } from "./db.js";

const POLL_INTERVAL_MS = Number(process.env.OUTBOX_POLL_INTERVAL_MS || 2000);
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE || 20);

let shouldStop = false;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizePayload(payload) {
  return typeof payload === "string" ? JSON.parse(payload) : payload;
}

function buildEventFromOutboxRow(row) {
  return {
    eventId: row.id,
    eventType: row.event_type,
    occurredAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    version: row.version || 1,
    correlationId: row.correlation_id || null,
    payload: normalizePayload(row.payload)
  };
}

async function processOneOutboxEvent(row) {
  const event = buildEventFromOutboxRow(row);

  await publishIntegrationEvent({
    routingKey: row.routing_key,
    event
  });

  await markOutboxEventPublished(row.id);

  console.log(
    `[outbox-worker] published eventId=${row.id} type=${row.event_type}`
  );
}

async function run() {
  console.log("[outbox-worker] starting...");

  await connectRabbitMQPublisher();
  await resetStuckPublishingEvents();

  while (!shouldStop) {
    const rows = await reservePendingOutboxEvents(BATCH_SIZE);

    if (rows.length === 0) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    for (const row of rows) {
      try {
        await processOneOutboxEvent(row);
      } catch (error) {
        console.error(`[outbox-worker] failed eventId=${row.id}:`, error.message);
        await markOutboxEventFailed(row.id, error);
      }
    }
  }
}

async function shutdown() {
  shouldStop = true;
  await closeRabbitMQPublisher();
  await db.destroy();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

run().catch(async (error) => {
  console.error("[outbox-worker] fatal error:", error);
  await closeRabbitMQPublisher();
  await db.destroy();
  process.exit(1);
});
