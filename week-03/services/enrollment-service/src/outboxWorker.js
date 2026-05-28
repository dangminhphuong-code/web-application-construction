import { callUnary, courseClient } from "./grpcClients.js";

function normalizePayload(payload) {
  if (typeof payload === "string") {
    return JSON.parse(payload);
  }

  return payload;
}

export function createOutboxWorker(enrollmentRepository) {
  let processing = false;

  async function processOneEvent(event) {
    const payload = normalizePayload(event.payload);

    await callUnary(
      courseClient,
      "applyEnrollmentConfirmed",
      {
        event_id: event.event_id,
        enrollment_id: payload.enrollment_id,
        student_id: payload.student_id,
        course_id: payload.course_id
      },
      2000
    );

    await enrollmentRepository.markOutboxProcessed(event.event_id);
  }

  async function processOutbox() {
    if (processing) return;
    processing = true;

    try {
      const events = await enrollmentRepository.findPendingOutboxEvents({
        limit: 10
      });

      for (const event of events) {
        try {
          await processOneEvent(event);
          console.log(`Processed outbox event ${event.event_id}`);
        } catch (error) {
          await enrollmentRepository.markOutboxFailed(
            event.event_id,
            event.attempts,
            error.message
          );

          console.error(`Failed outbox event ${event.event_id}:`, error.message);
        }
      }
    } finally {
      processing = false;
    }
  }

  return {
    start() {
      const intervalMs = Number(process.env.OUTBOX_INTERVAL_MS || 3000);

      processOutbox().catch((error) => {
        console.error("Outbox worker error:", error.message);
      });

      setInterval(() => {
        processOutbox().catch((error) => {
          console.error("Outbox worker error:", error.message);
        });
      }, intervalMs);

      console.log("Outbox worker started");
    }
  };
}
