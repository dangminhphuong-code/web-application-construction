import "dotenv/config";
import { db } from "./db.js";

const OUTBOX_TABLE = "outbox_events";
const MAX_ATTEMPTS = Number(process.env.OUTBOX_MAX_ATTEMPTS || 10);

export async function resetStuckPublishingEvents() {
  await db(OUTBOX_TABLE)
    .where({ status: "publishing" })
    .update({
      status: "pending",
      updated_at: db.fn.now()
    });
}

export async function reservePendingOutboxEvents(limit = 20) {
  return db.transaction(async (trx) => {
    const rows = await trx(OUTBOX_TABLE)
      .select("*")
      .where({ status: "pending" })
      .andWhere("attempts", "<", MAX_ATTEMPTS)
      .orderBy("created_at", "asc")
      .limit(limit)
      .forUpdate()
      .skipLocked();

    if (rows.length === 0) {
      return [];
    }

    await trx(OUTBOX_TABLE)
      .whereIn(
        "id",
        rows.map((row) => row.id)
      )
      .update({
        status: "publishing",
        updated_at: trx.fn.now()
      });

    return rows;
  });
}

export async function markOutboxEventPublished(eventId) {
  await db(OUTBOX_TABLE)
    .where({ id: eventId })
    .update({
      status: "published",
      published_at: db.fn.now(),
      updated_at: db.fn.now(),
      last_error: null
    });
}

export async function markOutboxEventFailed(eventId, error) {
  const row = await db(OUTBOX_TABLE)
    .select("attempts")
    .where({ id: eventId })
    .first();

  const nextAttempts = Number(row?.attempts || 0) + 1;

  await db(OUTBOX_TABLE)
    .where({ id: eventId })
    .update({
      attempts: nextAttempts,
      status: nextAttempts >= MAX_ATTEMPTS ? "failed" : "pending",
      last_error: String(error?.message || error).slice(0, 1000),
      updated_at: db.fn.now()
    });
}
