import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { resolvers } from "../src/resolvers.js";

function createGrpcContext(overrides = {}) {
  return {
    currentStudentId: null,
    loaders: {
      studentById: {
        load: jest.fn()
      },
      courseById: {
        load: jest.fn()
      }
    },
    grpc: {
      student: {
        call: jest.fn()
      },
      course: {
        call: jest.fn()
      },
      enrollment: {
        call: jest.fn()
      }
    },
    ...overrides
  };
}

function createGrpcStudent(overrides = {}) {
  return {
    id: "student-1",
    name: "Nguyen Van A",
    email: "student@example.com",
    status: "ACTIVE",
    ...overrides
  };
}

function createGrpcCourse(overrides = {}) {
  return {
    id: "course-1",
    title: "Distributed Systems",
    description: "Microservices and messaging",
    status: "OPEN",
    enrolled_count: 12,
    capacity: 30,
    instance_name: "course-service-1",
    ...overrides
  };
}

function createGrpcEnrollment(overrides = {}) {
  return {
    id: "enrollment-1",
    student_id: "student-1",
    course_id: "course-1",
    status: "CONFIRMED",
    ...overrides
  };
}

describe("graphql-server Query resolvers", () => {
  let ctx;

  beforeEach(() => {
    ctx = createGrpcContext();
  });

  test("student resolver calls student loader and maps response", async () => {
    ctx.loaders.studentById.load.mockResolvedValue(createGrpcStudent());

    await expect(
      resolvers.Query.student(null, { id: "student-1" }, ctx)
    ).resolves.toEqual({
      id: "student-1",
      name: "Nguyen Van A",
      email: "student@example.com",
      status: "ACTIVE"
    });

    expect(ctx.loaders.studentById.load).toHaveBeenCalledWith("student-1");
  });

  test("me resolver returns null without auth context", async () => {
    await expect(resolvers.Query.me(null, null, ctx)).resolves.toBeNull();
    expect(ctx.loaders.studentById.load).not.toHaveBeenCalled();
  });

  test("coursesPage maps snake_case gRPC response to GraphQL fields", async () => {
    ctx.grpc.course.call.mockResolvedValue({
      courses: [createGrpcCourse()],
      page_info: {
        total: 42,
        limit: 10,
        offset: 20,
        has_next_page: true,
        has_previous_page: true
      }
    });

    await expect(
      resolvers.Query.coursesPage(null, { limit: 10, offset: 20 }, ctx)
    ).resolves.toEqual({
      items: [
        {
          id: "course-1",
          title: "Distributed Systems",
          description: "Microservices and messaging",
          status: "OPEN",
          enrolledCount: 12,
          capacity: 30,
          instanceName: "course-service-1"
        }
      ],
      pageInfo: {
        total: 42,
        limit: 10,
        offset: 20,
        hasNextPage: true,
        hasPreviousPage: true
      }
    });

    expect(ctx.grpc.course.call).toHaveBeenCalledWith("listCourses", {
      limit: 10,
      offset: 20
    });
  });

  test("myEnrollments requires auth and calls enrollment service", async () => {
    ctx.currentStudentId = "student-1";
    ctx.grpc.enrollment.call.mockResolvedValue({
      enrollments: [createGrpcEnrollment()]
    });

    await expect(resolvers.Query.myEnrollments(null, null, ctx)).resolves.toEqual([
      {
        id: "enrollment-1",
        studentId: "student-1",
        courseId: "course-1",
        status: "CONFIRMED"
      }
    ]);

    expect(ctx.grpc.enrollment.call).toHaveBeenCalledWith(
      "listEnrollmentsByStudent",
      {
        student_id: "student-1"
      }
    );
  });

  test("myEnrollments throws UNAUTHENTICATED without auth context", async () => {
    await expect(resolvers.Query.myEnrollments(null, null, ctx)).rejects.toMatchObject({
      extensions: {
        code: "UNAUTHENTICATED"
      }
    });

    expect(ctx.grpc.enrollment.call).not.toHaveBeenCalled();
  });
});

describe("graphql-server Mutation resolvers", () => {
  let ctx;

  beforeEach(() => {
    ctx = createGrpcContext();
  });

  test("login calls authenticateStudent, maps student, and signs token", async () => {
    ctx.grpc.student.call.mockResolvedValue({
      success: true,
      student: createGrpcStudent()
    });

    const result = await resolvers.Mutation.login(
      null,
      {
        email: "student@example.com",
        password: "secret123"
      },
      ctx
    );

    expect(result.student).toEqual({
      id: "student-1",
      name: "Nguyen Van A",
      email: "student@example.com",
      status: "ACTIVE"
    });
    expect(result.token).toEqual(expect.any(String));
    expect(ctx.grpc.student.call).toHaveBeenCalledWith("authenticateStudent", {
      email: "student@example.com",
      password: "secret123"
    });
  });

  test("login rejects invalid credentials with UNAUTHENTICATED", async () => {
    ctx.grpc.student.call.mockResolvedValue({
      success: false,
      student: null
    });

    await expect(
      resolvers.Mutation.login(
        null,
        {
          email: "student@example.com",
          password: "wrong-password"
        },
        ctx
      )
    ).rejects.toMatchObject({
      extensions: {
        code: "UNAUTHENTICATED"
      }
    });
  });

  test("createMyEnrollment uses auth context and maps enrollment response", async () => {
    ctx.currentStudentId = "student-1";
    ctx.grpc.enrollment.call.mockResolvedValue({
      enrollment: createGrpcEnrollment()
    });

    await expect(
      resolvers.Mutation.createMyEnrollment(null, { courseId: "course-1" }, ctx)
    ).resolves.toEqual({
      id: "enrollment-1",
      studentId: "student-1",
      courseId: "course-1",
      status: "CONFIRMED"
    });

    expect(ctx.grpc.enrollment.call).toHaveBeenCalledWith(
      "createEnrollment",
      {
        student_id: "student-1",
        course_id: "course-1"
      },
      {
        timeoutMs: 2500
      }
    );
  });
});

describe("graphql-server field resolvers", () => {
  let ctx;

  beforeEach(() => {
    ctx = createGrpcContext();
  });

  test("Enrollment.student calls student loader and maps response", async () => {
    ctx.loaders.studentById.load.mockResolvedValue(createGrpcStudent());

    await expect(
      resolvers.Enrollment.student({ studentId: "student-1" }, null, ctx)
    ).resolves.toEqual({
      id: "student-1",
      name: "Nguyen Van A",
      email: "student@example.com",
      status: "ACTIVE"
    });

    expect(ctx.loaders.studentById.load).toHaveBeenCalledWith("student-1");
  });

  test("Enrollment.course calls course loader and maps response", async () => {
    ctx.loaders.courseById.load.mockResolvedValue(createGrpcCourse());

    await expect(
      resolvers.Enrollment.course({ courseId: "course-1" }, null, ctx)
    ).resolves.toEqual({
      id: "course-1",
      title: "Distributed Systems",
      description: "Microservices and messaging",
      status: "OPEN",
      enrolledCount: 12,
      capacity: 30,
      instanceName: "course-service-1"
    });

    expect(ctx.loaders.courseById.load).toHaveBeenCalledWith("course-1");
  });
});
