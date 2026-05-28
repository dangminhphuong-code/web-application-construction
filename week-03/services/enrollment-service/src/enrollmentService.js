import crypto from "node:crypto";

function ensureRequired(value, message) {
  if (!value || !String(value).trim()) {
    const error = new Error(message);
    error.code = "INVALID_ARGUMENT";
    throw error;
  }
}

function normalizeCourseId(courseId) {
  const value = Number(courseId);
  if (!Number.isInteger(value) || value <= 0) {
    const error = new Error("Valid course id is required");
    error.code = "INVALID_ARGUMENT";
    throw error;
  }

  return value;
}

export function createEnrollmentService({
  enrollmentRepository,
  studentGateway,
  courseGateway
}) {
  return {
    async createEnrollment({ student_id, course_id }) {
      ensureRequired(student_id, "Student id is required");
      const courseId = normalizeCourseId(course_id);

      const student = await studentGateway.getStudent(student_id);
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
          studentId: student_id,
          courseId,
          eventId: crypto.randomUUID()
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
      ensureRequired(student_id, "Student id is required");
      return enrollmentRepository.findByStudentId(student_id);
    },

    async listStudentCourseIds({ student_id }) {
      ensureRequired(student_id, "Student id is required");

      return {
        course_ids: await enrollmentRepository.findCourseIdsByStudentId(student_id)
      };
    },

    async listCourseStudentIds({ course_id }) {
      const courseId = normalizeCourseId(course_id);

      return {
        student_ids: await enrollmentRepository.findStudentIdsByCourseId(courseId)
      };
    }
  };
}
