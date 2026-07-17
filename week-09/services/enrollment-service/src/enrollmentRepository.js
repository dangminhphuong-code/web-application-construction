const ENROLLMENTS_TABLE = "enrollments";
const OUTBOX_TABLE = "outbox_events";
const ENROLLMENT_COLUMNS = ["id", "student_id", "course_id", "status"];

export function createEnrollmentRepository(db) {
  return {
    async createEnrollmentWithOutbox({
      enrollmentId,
      studentId,
      courseId,
      eventId,
      correlationId = null
    }) {
      return db.transaction(async (trx) => {
        const [enrollment] = await trx(ENROLLMENTS_TABLE)
          .insert({
            id: enrollmentId,
            student_id: studentId,
            course_id: courseId,
            status: "CONFIRMED"
          })
          .returning(ENROLLMENT_COLUMNS);

        await trx(OUTBOX_TABLE).insert({
          id: eventId,
          event_type: "EnrollmentConfirmed",
          routing_key: "enrollment.confirmed",
          version: 1,
          correlation_id: correlationId,
          payload: {
            enrollmentId: enrollment.id,
            studentId,
            courseId
          },
          status: "pending",
          attempts: 0
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
    }
  };
}
