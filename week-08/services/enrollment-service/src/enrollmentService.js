import crypto from "node:crypto";

function ensureRequired(value, message) {
  if (!value || !String(value).trim()) {
    const error = new Error(message);
    error.code = "INVALID_ARGUMENT";
    throw error;
  }
}

function normalizeId(value, fieldName) {
  ensureRequired(value, `${fieldName} is required`);
  return String(value).trim();
}

export function createEnrollmentService({
  enrollmentRepository,
  studentGateway,
  courseGateway
}) {
  return {
    async createEnrollment({ student_id, course_id }) {
      const studentId = normalizeId(student_id, "Student id");
      const courseId = normalizeId(course_id, "Course id");

      const student = await studentGateway.getStudent(studentId);
      if (!student || student.status !== "ACTIVE") {
        const error = new Error("Student is not active");
        error.code = "FAILED_PRECONDITION";
        throw error;
      }

      const course = await courseGateway.getCourse(courseId);
      if (!course) {
        const error = new Error("Course not found");
        error.code = "NOT_FOUND";
        throw error;
      }

      if (course.status !== "OPEN") {
        const error = new Error("Course is not open");
        error.code = "FAILED_PRECONDITION";
        throw error;
      }

      if (course.enrolled_count >= course.capacity) {
        const error = new Error("Course is full");
        error.code = "FAILED_PRECONDITION";
        throw error;
      }

      try {
        return await enrollmentRepository.createEnrollmentWithOutbox({
          enrollmentId: crypto.randomUUID(),
          studentId,
          courseId,
          eventId: crypto.randomUUID(),
          correlationId: crypto.randomUUID()
        });
      } catch (error) {
        if (error.code === "23505") {
          const duplicated = new Error("Student already enrolled in course");
          duplicated.code = "ALREADY_EXISTS";
          throw duplicated;
        }

        throw error;
      }
    },

    async listEnrollmentsByStudent({ student_id }) {
      const studentId = normalizeId(student_id, "Student id");
      return enrollmentRepository.findByStudentId(studentId);
    },

    async listStudentCourseIds({ student_id }) {
      const studentId = normalizeId(student_id, "Student id");

      return {
        course_ids: await enrollmentRepository.findCourseIdsByStudentId(studentId)
      };
    },

    async listCourseStudentIds({ course_id }) {
      const courseId = normalizeId(course_id, "Course id");

      return {
        student_ids: await enrollmentRepository.findStudentIdsByCourseId(courseId)
      };
    }
  };
}
