const ENROLLMENTS_TABLE = "enrollments";
const OUTBOX_TABLE = "outbox_events";
const ENROLLMENT_COLUMNS = ["id", "student_id", "course_id", "status"];

export function createEnrollmentRepository(db) {
  return {
    async createEnrollmentWithOutbox({ studentId, courseId, eventId }) {
      return db.transaction(async (trx) => {
        const [enrollment] = await trx(ENROLLMENTS_TABLE)
          .insert({
            student_id: studentId,
            course_id: courseId,
            status: "CONFIRMED"
          })
          .returning(ENROLLMENT_COLUMNS);

        await trx(OUTBOX_TABLE).insert({
          event_id: eventId,
          event_type: "ENROLLMENT_CONFIRMED",
          aggregate_type: "ENROLLMENT",
          aggregate_id: enrollment.id,
          payload: {
            enrollment_id: enrollment.id,
            student_id: studentId,
            course_id: courseId
          },
          status: "PENDING"
        });

        return enrollment;
      });
    },

    async findByStudentId(studentId) {
      return db(ENROLLMENTS_TABLE)
        .select(ENROLLMENT_COLUMNS)
        .where({ student_id: studentId })
        .orderBy("id", "desc");
    },

    async findCourseIdsByStudentId(studentId) {
      const rows = await db(ENROLLMENTS_TABLE)
        .select("course_id")
        .where({ student_id: studentId })
        .orderBy("course_id", "asc");

      return rows.map((row) => row.course_id);
    },

    async findStudentIdsByCourseId(courseId) {
      const rows = await db(ENROLLMENTS_TABLE)
        .select("student_id")
        .where({ course_id: courseId })
        .orderBy("student_id", "asc");

      return rows.map((row) => row.student_id);
    },

    async findPendingOutboxEvents({ limit }) {
      return db(OUTBOX_TABLE)
        .whereIn("status", ["PENDING", "FAILED"])
        .andWhere("attempts", "<", 5)
        .orderBy("created_at", "asc")
        .limit(limit);
    },

    async markOutboxProcessed(eventId) {
      return db(OUTBOX_TABLE)
        .where({ event_id: eventId })
        .update({
          status: "PROCESSED",
          processed_at: db.fn.now(),
          last_error: null
        });
    },

    async markOutboxFailed(eventId, attempts, errorMessage) {
      return db(OUTBOX_TABLE)
        .where({ event_id: eventId })
        .update({
          status: "FAILED",
          attempts: attempts + 1,
          last_error: errorMessage
        });
    }
  };
}
