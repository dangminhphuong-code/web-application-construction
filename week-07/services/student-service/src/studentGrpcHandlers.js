import grpc from "@grpc/grpc-js";

function toGrpcError(error) {
  if (error.code === "NOT_FOUND") {
    return { code: grpc.status.NOT_FOUND, message: error.message };
  }

  if (error.code === "INVALID_ARGUMENT") {
    return { code: grpc.status.INVALID_ARGUMENT, message: error.message };
  }

  if (error.code === "ALREADY_EXISTS") {
    return { code: grpc.status.ALREADY_EXISTS, message: error.message };
  }

  return { code: grpc.status.INTERNAL, message: "Internal student service error" };
}

export function createStudentGrpcHandlers(studentService) {
  return {
    async getStudent(call, callback) {
      try {
        const student = await studentService.getStudent(call.request);
        callback(null, { student });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async batchGetStudents(call, callback) {
      try {
        callback(null, await studentService.batchGetStudents(call.request));
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async listStudents(call, callback) {
      try {
        callback(null, await studentService.listStudents(call.request));
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async authenticateStudent(call, callback) {
      try {
        callback(null, await studentService.authenticateStudent(call.request));
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async createStudent(call, callback) {
      try {
        const student = await studentService.createStudent(call.request);
        callback(null, { student });
      } catch (error) {
        callback(toGrpcError(error));
      }
    }
  };
}
