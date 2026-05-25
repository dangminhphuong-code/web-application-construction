const TABLE_NAME = "enrollments";

export function createEnrollmentRepository(db) {
  return {
    async create(enrollment) {
      await db(TABLE_NAME).insert(enrollment);
      return enrollment;
    },

    async deleteByStudentAndCourse({ student_id, course_id }) {
      return db(TABLE_NAME)
        .where({
          student_id,
          course_id
        })
        .del();
    },

    async findByStudentAndCourse({ student_id, course_id }) {
      return db(TABLE_NAME)
        .select("id", "student_id", "course_id")
        .where({
          student_id,
          course_id
        })
        .first();
    },

    async listCourseIdsByStudentId(student_id) {
      const rows = await db(TABLE_NAME)
        .select("course_id")
        .where({ student_id })
        .orderBy("created_at", "desc");

      return rows.map((row) => String(row.course_id));
    },

    async listStudentIdsByCourseId(course_id) {
      const rows = await db(TABLE_NAME)
        .select("student_id")
        .where({ course_id })
        .orderBy("created_at", "desc");

      return rows.map((row) => String(row.student_id));
    }
  };
}
