import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const EVENT_TTL_SECONDS = Number(
  process.env.NOTIFICATION_EVENT_DEDUP_TTL_SECONDS || 86400
);

let client;
let connectPromise;

function eventKey(eventId) {
  return `notification:processed:${eventId}`;
}

function getClient() {
  if (!client) {
    client = createClient({ url: REDIS_URL });
    client.on("error", (error) => {
      console.warn("[notification-dedup] redis error:", error.message);
    });
  }

  return client;
}

async function connectedClient() {
  const redisClient = getClient();
  if (redisClient.isReady) return redisClient;

  if (!connectPromise) {
    connectPromise = redisClient.connect().finally(() => {
      connectPromise = null;
    });
  }

  await connectPromise;
  return redisClient;
}

export async function claimEvent(eventId) {
  if (!eventId) return true;

  try {
    const redisClient = await connectedClient();
    const result = await redisClient.set(eventKey(eventId), "1", {
      NX: true,
      EX: EVENT_TTL_SECONDS
    });
    return result === "OK";
  } catch (error) {
    console.warn("[notification-dedup] bypassed:", error.message);
    return true;
  }
}

export async function releaseEvent(eventId) {
  if (!eventId) return;

  try {
    const redisClient = await connectedClient();
    await redisClient.del(eventKey(eventId));
  } catch (error) {
    console.warn("[notification-dedup] release failed:", error.message);
  }
}

export async function closeEventDeduplicator() {
  if (client?.isOpen) await client.quit();
  client = null;
  connectPromise = null;
}