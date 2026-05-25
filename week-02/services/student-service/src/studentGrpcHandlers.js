import grpc from "@grpc/grpc-js";

function createGrpcError(code, message) {
  return Object.assign(new Error(message), {
    code,
    details: message
  });
}

function toGrpcError(error) {
  if (error.code === "NOT_FOUND") {
    return createGrpcError(grpc.status.NOT_FOUND, error.message);
  }

  if (error.code === "ALREADY_EXISTS") {
    return createGrpcError(grpc.status.ALREADY_EXISTS, error.message);
  }

  if (error.code === "INVALID_ARGUMENT") {
    return createGrpcError(grpc.status.INVALID_ARGUMENT, error.message);
  }

  return createGrpcError(grpc.status.INTERNAL, "Internal student service error");
}

export function createStudentGrpcHandlers(studentService) {
  return {
    async getStudent(call, callback) {
      try {
        const student = await studentService.getStudent(call.request.id);
        callback(null, { student });
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
    },

    async authenticateStudent(call, callback) {
      try {
        const result = await studentService.authenticateStudent(call.request);
        callback(null, result);
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async listStudents(call, callback) {
      try {
        const result = await studentService.listStudents(call.request);
        callback(null, result);
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async batchGetStudents(call, callback) {
      try {
        const students = await studentService.batchGetStudents(call.request.ids);
        callback(null, { students });
      } catch (error) {
        callback(toGrpcError(error));
      }
    }
  };
}
