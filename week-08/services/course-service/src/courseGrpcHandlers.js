import grpc from "@grpc/grpc-js";

function toGrpcError(error) {
  if (error.code === "NOT_FOUND") {
    return { code: grpc.status.NOT_FOUND, message: error.message };
  }

  if (error.code === "INVALID_ARGUMENT") {
    return { code: grpc.status.INVALID_ARGUMENT, message: error.message };
  }

  if (error.code === "FAILED_PRECONDITION") {
    return { code: grpc.status.FAILED_PRECONDITION, message: error.message };
  }

  return { code: grpc.status.INTERNAL, message: "Internal course service error" };
}

export function createCourseGrpcHandlers(courseService) {
  return {
    async getCourse(call, callback) {
      try {
        const course = await courseService.getCourse(call.request);
        callback(null, {
          course,
          instance_name: course.instance_name
        });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async batchGetCourses(call, callback) {
      try {
        callback(null, await courseService.batchGetCourses(call.request));
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async listCourses(call, callback) {
      try {
        callback(null, await courseService.listCourses(call.request));
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async listTopCourses(call, callback) {
      try {
        callback(null, await courseService.listTopCourses(call.request));
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async createCourse(call, callback) {
      try {
        const course = await courseService.createCourse(call.request);
        callback(null, {
          course,
          instance_name: course.instance_name
        });
      } catch (error) {
        callback(toGrpcError(error));
      }
    },

    async applyEnrollmentConfirmed(call, callback) {
      try {
        callback(null, await courseService.applyEnrollmentConfirmed(call.request));
      } catch (error) {
        callback(toGrpcError(error));
      }
    }
  };
}