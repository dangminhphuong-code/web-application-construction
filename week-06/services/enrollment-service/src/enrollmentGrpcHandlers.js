import grpc from "@grpc/grpc-js";

function toGrpcError(error) {
  if (error.code === "NOT_FOUND" || error.code === grpc.status.NOT_FOUND) {
    return { code: grpc.status.NOT_FOUND, message: error.message };
  }

  if (error.code === "INVALID_ARGUMENT" || error.code === grpc.status.INVALID_ARGUMENT) {
    return { code: grpc.status.INVALID_ARGUMENT, message: error.message };
  }

  if (error.code === "ALREADY_EXISTS" || error.code === grpc.status.ALREADY_EXISTS) {
    return { code: grpc.status.ALREADY_EXISTS, message: error.message };
  }

  if (
    error.code === "FAILED_PRECONDITION" ||
    error.code === grpc.status.FAILED_PRECONDITION
  ) {
    return { code: grpc.status.FAILED_PRECONDITION, message: error.message };
  }

  if (error.code === "UNAVAILABLE" || error.code === grpc.status.UNAVAILABLE) {
    return { code: grpc.status.UNAVAILABLE, message: error.message };
  }

  if (error.code === grpc.status.DEADLINE_EXCEEDED) {
    return { code: grpc.status.UNAVAILABLE, message: error.message };
  }

  return { code: grpc.status.INTERNAL, message: "Internal enrollment service error" };
}

export function createEnrollmentGrpcHandlers(enrollmentService) {
  return {
    async createEnrollment(call, callback) {
      try {
        const enrollment = await enrollmentService.createEnrollment(call.request);
        callback(null, { enrollment });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async listEnrollmentsByStudent(call, callback) {
      try {
        const enrollments = await enrollmentService.listEnrollmentsByStudent(call.request);
        callback(null, { enrollments });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async listStudentCourseIds(call, callback) {
      try {
        callback(null, await enrollmentService.listStudentCourseIds(call.request));
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async listCourseStudentIds(call, callback) {
      try {
        callback(null, await enrollmentService.listCourseStudentIds(call.request));
      } catch (error) {
        callback(toGrpcError(error));
      }
    }
  };
}
