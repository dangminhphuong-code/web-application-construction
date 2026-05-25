import { GraphQLError } from "graphql";
import { createToken, requireAuth } from "./auth.js";
import { grpc } from "./grpcClients.js";

function mapPageInfo(pageInfo = {}) {
  return {
    total: pageInfo.total || 0,
    limit: pageInfo.limit || 0,
    offset: pageInfo.offset || 0,
    hasNextPage: Boolean(pageInfo.has_next_page),
    hasPreviousPage: Boolean(pageInfo.has_previous_page)
  };
}

function toGraphQLError(error, fallbackMessage = "Internal server error") {
  if (error instanceof GraphQLError) return error;

  const message = error.details || error.message || fallbackMessage;

  if (error.code === grpc.status.NOT_FOUND) {
    return new GraphQLError(message, {
      extensions: {
        code: "NOT_FOUND"
      }
    });
  }

  if (error.code === grpc.status.INVALID_ARGUMENT) {
    return new GraphQLError(message, {
      extensions: {
        code: "BAD_USER_INPUT"
      }
    });
  }

  if (error.code === grpc.status.ALREADY_EXISTS) {
    return new GraphQLError(message, {
      extensions: {
        code: "ALREADY_EXISTS"
      }
    });
  }

  if (error.code === grpc.status.UNAVAILABLE) {
    return new GraphQLError("A backend service is unavailable", {
      extensions: {
        code: "SERVICE_UNAVAILABLE"
      }
    });
  }

  if (error.code === grpc.status.DEADLINE_EXCEEDED) {
    return new GraphQLError("A backend service timed out", {
      extensions: {
        code: "SERVICE_TIMEOUT"
      }
    });
  }

  return new GraphQLError(fallbackMessage, {
    extensions: {
      code: "INTERNAL_SERVER_ERROR"
    }
  });
}

function removeLoaderErrors(values) {
  return values.filter((value) => value && !(value instanceof Error));
}

export const resolvers = {
  Query: {
    async student(_, { id }, ctx) {
      try {
        return await ctx.loaders.studentById.load(String(id));
      } catch (error) {
        if (error.code === grpc.status.NOT_FOUND) return null;
        throw toGraphQLError(error, "Cannot load student");
      }
    },

    async me(_, _args, ctx) {
      if (!ctx.currentStudentId) return null;

      try {
        return await ctx.loaders.studentById.load(ctx.currentStudentId);
      } catch {
        return null;
      }
    },

    async students(_, { limit = 20, offset = 0 }, ctx) {
      try {
        const response = await ctx.grpc.student.call("listStudents", {
          limit,
          offset
        });

        return response.students || [];
      } catch (error) {
        throw toGraphQLError(error, "Cannot load students");
      }
    },

    async studentsPage(_, { limit = 20, offset = 0 }, ctx) {
      try {
        const response = await ctx.grpc.student.call("listStudents", {
          limit,
          offset
        });

        return {
          items: response.students || [],
          pageInfo: mapPageInfo(response.page_info)
        };
      } catch (error) {
        throw toGraphQLError(error, "Cannot load students page");
      }
    },

    async course(_, { id }, ctx) {
      try {
        return await ctx.loaders.courseById.load(String(id));
      } catch (error) {
        if (error.code === grpc.status.NOT_FOUND) return null;
        throw toGraphQLError(error, "Cannot load course");
      }
    },

    async courses(_, { limit = 20, offset = 0 }, ctx) {
      try {
        const response = await ctx.grpc.course.call("listCourses", {
          limit,
          offset
        });

        return response.courses || [];
      } catch (error) {
        throw toGraphQLError(error, "Cannot load courses");
      }
    },

    async coursesPage(_, { limit = 20, offset = 0 }, ctx) {
      try {
        const response = await ctx.grpc.course.call("listCourses", {
          limit,
          offset
        });

        return {
          items: response.courses || [],
          pageInfo: mapPageInfo(response.page_info)
        };
      } catch (error) {
        throw toGraphQLError(error, "Cannot load courses page");
      }
    }
  },

  Mutation: {
    async login(_, { email, password }, ctx) {
      try {
        const response = await ctx.grpc.student.call("authenticateStudent", {
          email,
          password
        });

        if (!response.success || !response.student) {
          throw new GraphQLError("Invalid email or password", {
            extensions: {
              code: "UNAUTHENTICATED"
            }
          });
        }

        return {
          token: createToken(response.student),
          student: response.student
        };
      } catch (error) {
        throw toGraphQLError(error, "Cannot login");
      }
    },

    async createStudent(_, { input }, ctx) {
      try {
        const response = await ctx.grpc.student.call("createStudent", input);
        return response.student;
      } catch (error) {
        throw toGraphQLError(error, "Cannot create student");
      }
    },

    async createCourse(_, { input }, ctx) {
      requireAuth(ctx);

      try {
        const response = await ctx.grpc.course.call("createCourse", input);
        return response.course;
      } catch (error) {
        throw toGraphQLError(error, "Cannot create course");
      }
    },

    async enrollCourse(_, { courseId }, ctx) {
      const currentStudentId = requireAuth(ctx);

      try {
        const course = await ctx.loaders.courseById.load(String(courseId));
        if (!course) {
          throw new GraphQLError("Course not found", {
            extensions: {
              code: "NOT_FOUND"
            }
          });
        }

        const response = await ctx.grpc.enrollment.call("enrollStudent", {
          student_id: currentStudentId,
          course_id: String(courseId)
        });

        return Boolean(response.success);
      } catch (error) {
        throw toGraphQLError(error, "Cannot enroll course");
      }
    },

    async unenrollCourse(_, { courseId }, ctx) {
      const currentStudentId = requireAuth(ctx);

      try {
        const response = await ctx.grpc.enrollment.call("unenrollStudent", {
          student_id: currentStudentId,
          course_id: String(courseId)
        });

        return Boolean(response.success);
      } catch (error) {
        throw toGraphQLError(error, "Cannot unenroll course");
      }
    }
  },

  Student: {
    async courses(parent, _args, ctx) {
      const courseIds = await ctx.loaders.courseIdsByStudentId.load(parent.id);
      if (!courseIds.length) return [];

      const courses = await ctx.loaders.courseById.loadMany(courseIds);
      return removeLoaderErrors(courses);
    }
  },

  Course: {
    async students(parent, _args, ctx) {
      const studentIds = await ctx.loaders.studentIdsByCourseId.load(parent.id);
      if (!studentIds.length) return [];

      const students = await ctx.loaders.studentById.loadMany(studentIds);
      return removeLoaderErrors(students);
    }
  }
};
