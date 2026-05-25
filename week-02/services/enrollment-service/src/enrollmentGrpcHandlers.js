import grpc from "@grpc/grpc-js";

function createGrpcError(code, message) {
  return Object.assign(new Error(message), {
    code,
    details: message
  });
}

function toGrpcError(error) {
  if (error.code === "ALREADY_EXISTS") {
    return createGrpcError(grpc.status.ALREADY_EXISTS, error.message);
  }

  if (error.code === "INVALID_ARGUMENT") {
    return createGrpcError(grpc.status.INVALID_ARGUMENT, error.message);
  }

  return createGrpcError(grpc.status.INTERNAL, "Internal enrollment service error");
}

export function createEnrollmentGrpcHandlers(enrollmentService) {
  return {
    async enrollStudent(call, callback) {
      try {
        const result = await enrollmentService.enrollStudent(call.request);
        callback(null, result);
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async unenrollStudent(call, callback) {
      try {
        const result = await enrollmentService.unenrollStudent(call.request);
        callback(null, result);
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async listStudentCourseIds(call, callback) {
      try {
        const course_ids = await enrollmentService.listStudentCourseIds(call.request);
        callback(null, { course_ids });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async listCourseStudentIds(call, callback) {
      try {
        const student_ids = await enrollmentService.listCourseStudentIds(call.request);
        callback(null, { student_ids });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async isEnrolled(call, callback) {
      try {
        const enrolled = await enrollmentService.isEnrolled(call.request);
        callback(null, { enrolled });
      } catch (error) {
        callback(toGrpcError(error));
      }
    }
  };
}
