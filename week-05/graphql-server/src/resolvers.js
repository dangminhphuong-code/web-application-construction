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

function mapStudent(student) {
  if (!student) return null;

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    status: student.status
  };
}

function mapCourse(course) {
  if (!course) return null;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    status: course.status,
    enrolledCount: course.enrolled_count,
    capacity: course.capacity
  };
}

function mapEnrollment(enrollment) {
  if (!enrollment) return null;

  return {
    id: enrollment.id,
    studentId: enrollment.student_id,
    courseId: enrollment.course_id,
    status: enrollment.status
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

  if (error.code === grpc.status.FAILED_PRECONDITION) {
    return new GraphQLError(message, {
      extensions: {
        code: "FAILED_PRECONDITION"
      }
    });
  }

  if (error.code === grpc.status.UNAUTHENTICATED) {
    return new GraphQLError(message, {
      extensions: {
        code: "UNAUTHENTICATED"
      }
    });
  }

  if (error.code === grpc.status.PERMISSION_DENIED) {
    return new GraphQLError(message, {
      extensions: {
        code: "FORBIDDEN"
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

export const resolvers = {
  Query: {
    async student(_, { id }, ctx) {
      try {
        return mapStudent(await ctx.loaders.studentById.load(String(id)));
      } catch (error) {
        if (error.code === grpc.status.NOT_FOUND) return null;
        throw toGraphQLError(error, "Cannot load student");
      }
    },

    async me(_, _args, ctx) {
      if (!ctx.currentStudentId) return null;

      try {
        return mapStudent(await ctx.loaders.studentById.load(ctx.currentStudentId));
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

        return (response.students || []).map(mapStudent);
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
          items: (response.students || []).map(mapStudent),
          pageInfo: mapPageInfo(response.page_info)
        };
      } catch (error) {
        throw toGraphQLError(error, "Cannot load students page");
      }
    },

    async course(_, { id }, ctx) {
      try {
        return mapCourse(await ctx.loaders.courseById.load(String(id)));
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

        return (response.courses || []).map(mapCourse);
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
          items: (response.courses || []).map(mapCourse),
          pageInfo: mapPageInfo(response.page_info)
        };
      } catch (error) {
        throw toGraphQLError(error, "Cannot load courses page");
      }
    },

    async enrollmentsByStudent(_, { studentId }, ctx) {
      try {
        const response = await ctx.grpc.enrollment.call(
          "listEnrollmentsByStudent",
          {
            student_id: String(studentId)
          }
        );

        return (response.enrollments || []).map(mapEnrollment);
      } catch (error) {
        throw toGraphQLError(error, "Cannot load enrollments");
      }
    },

    async myEnrollments(_, _args, ctx) {
      const currentStudentId = requireAuth(ctx);

      try {
        const response = await ctx.grpc.enrollment.call(
          "listEnrollmentsByStudent",
          {
            student_id: currentStudentId
          }
        );

        return (response.enrollments || []).map(mapEnrollment);
      } catch (error) {
        throw toGraphQLError(error, "Cannot load my enrollments");
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
          student: mapStudent(response.student)
        };
      } catch (error) {
        throw toGraphQLError(error, "Cannot login");
      }
    },

    async createStudent(_, { input }, ctx) {
      try {
        const response = await ctx.grpc.student.call("createStudent", input);
        return mapStudent(response.student);
      } catch (error) {
        throw toGraphQLError(error, "Cannot create student");
      }
    },

    async createEnrollment(_, { input }, ctx) {
      try {
        const response = await ctx.grpc.enrollment.call(
          "createEnrollment",
          {
            student_id: String(input.studentId),
            course_id: String(input.courseId)
          },
          {
            timeoutMs: Number(process.env.GRPC_ENROLLMENT_TIMEOUT_MS || 2500)
          }
        );

        return mapEnrollment(response.enrollment);
      } catch (error) {
        throw toGraphQLError(error, "Cannot create enrollment");
      }
    },

    async createMyEnrollment(_, { courseId }, ctx) {
      const currentStudentId = requireAuth(ctx);

      try {
        const response = await ctx.grpc.enrollment.call(
          "createEnrollment",
          {
            student_id: currentStudentId,
            course_id: String(courseId)
          },
          {
            timeoutMs: Number(process.env.GRPC_ENROLLMENT_TIMEOUT_MS || 2500)
          }
        );

        return mapEnrollment(response.enrollment);
      } catch (error) {
        throw toGraphQLError(error, "Cannot create my enrollment");
      }
    }
  },

  Enrollment: {
    async student(parent, _args, ctx) {
      return mapStudent(await ctx.loaders.studentById.load(String(parent.studentId)));
    },

    async course(parent, _args, ctx) {
      return mapCourse(await ctx.loaders.courseById.load(String(parent.courseId)));
    }
  }
};
