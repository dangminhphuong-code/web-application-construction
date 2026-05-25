import crypto from "node:crypto";

function serviceError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertEnrollmentRequest({ student_id, course_id }) {
  if (!student_id || !course_id) {
    throw serviceError("Student id and course id are required", "INVALID_ARGUMENT");
  }
}

export function createEnrollmentService(enrollmentRepository) {
  return {
    async enrollStudent({ student_id, course_id }) {
      assertEnrollmentRequest({ student_id, course_id });

      const existing = await enrollmentRepository.findByStudentAndCourse({
        student_id,
        course_id
      });

      if (existing) {
        throw serviceError("Student is already enrolled in this course", "ALREADY_EXISTS");
      }

      await enrollmentRepository.create({
        id: crypto.randomUUID(),
        student_id,
        course_id
      });

      return {
        success: true,
        message: "Enrolled"
      };
    },

    async unenrollStudent({ student_id, course_id }) {
      assertEnrollmentRequest({ student_id, course_id });

      const deletedCount = await enrollmentRepository.deleteByStudentAndCourse({
        student_id,
        course_id
      });

      return {
        success: deletedCount > 0,
        message: deletedCount > 0 ? "Unenrolled" : "Enrollment not found"
      };
    },

    async listStudentCourseIds({ student_id }) {
      if (!student_id) {
        throw serviceError("Student id is required", "INVALID_ARGUMENT");
      }

      return enrollmentRepository.listCourseIdsByStudentId(student_id);
    },

    async listCourseStudentIds({ course_id }) {
      if (!course_id) {
        throw serviceError("Course id is required", "INVALID_ARGUMENT");
      }

      return enrollmentRepository.listStudentIdsByCourseId(course_id);
    },

    async isEnrolled({ student_id, course_id }) {
      assertEnrollmentRequest({ student_id, course_id });

      const existing = await enrollmentRepository.findByStudentAndCourse({
        student_id,
        course_id
      });

      return Boolean(existing);
    }
  };
}
