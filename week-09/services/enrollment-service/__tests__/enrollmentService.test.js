import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { createEnrollmentService } from "../src/enrollmentService.js";

function createMockRepository() {
  return {
    createEnrollmentWithOutbox: jest.fn(),
    findByStudentId: jest.fn(),
    findCourseIdsByStudentId: jest.fn(),
    findStudentIdsByCourseId: jest.fn()
  };
}

function createGatewayMocks() {
  return {
    studentGateway: {
      getStudent: jest.fn()
    },
    courseGateway: {
      getCourse: jest.fn()
    }
  };
}

function createServiceContext() {
  const enrollmentRepository = createMockRepository();
  const { studentGateway, courseGateway } = createGatewayMocks();
  const service = createEnrollmentService({
    enrollmentRepository,
    studentGateway,
    courseGateway
  });

  return {
    enrollmentRepository,
    studentGateway,
    courseGateway,
    service
  };
}

describe("enrollment-service createEnrollment", () => {
  let enrollmentRepository;
  let studentGateway;
  let courseGateway;
  let service;

  beforeEach(() => {
    ({ enrollmentRepository, studentGateway, courseGateway, service } =
      createServiceContext());
  });

  test("creates enrollment after validating student and course through gRPC gateways", async () => {
    studentGateway.getStudent.mockResolvedValue({
      id: "student-1",
      status: "ACTIVE"
    });
    courseGateway.getCourse.mockResolvedValue({
      id: "course-1",
      status: "OPEN",
      enrolled_count: 12,
      capacity: 30
    });
    enrollmentRepository.createEnrollmentWithOutbox.mockResolvedValue({
      id: "enrollment-1",
      student_id: "student-1",
      course_id: "course-1",
      status: "CONFIRMED"
    });

    await expect(
      service.createEnrollment({
        student_id: "student-1",
        course_id: "course-1"
      })
    ).resolves.toEqual({
      id: "enrollment-1",
      student_id: "student-1",
      course_id: "course-1",
      status: "CONFIRMED"
    });

    expect(studentGateway.getStudent).toHaveBeenCalledWith("student-1");
    expect(courseGateway.getCourse).toHaveBeenCalledWith("course-1");
    expect(enrollmentRepository.createEnrollmentWithOutbox).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: "student-1",
        courseId: "course-1"
      })
    );
  });

  test("does not create enrollment when student validation fails", async () => {
    studentGateway.getStudent.mockResolvedValue({
      id: "student-1",
      status: "INACTIVE"
    });

    await expect(
      service.createEnrollment({
        student_id: "student-1",
        course_id: "course-1"
      })
    ).rejects.toMatchObject({
      code: "FAILED_PRECONDITION",
      message: "Student is not active"
    });

    expect(courseGateway.getCourse).not.toHaveBeenCalled();
    expect(enrollmentRepository.createEnrollmentWithOutbox).not.toHaveBeenCalled();
  });

  test("does not create enrollment when course is full", async () => {
    studentGateway.getStudent.mockResolvedValue({
      id: "student-1",
      status: "ACTIVE"
    });
    courseGateway.getCourse.mockResolvedValue({
      id: "course-1",
      status: "OPEN",
      enrolled_count: 30,
      capacity: 30
    });

    await expect(
      service.createEnrollment({
        student_id: "student-1",
        course_id: "course-1"
      })
    ).rejects.toMatchObject({
      code: "FAILED_PRECONDITION",
      message: "Course is full"
    });

    expect(enrollmentRepository.createEnrollmentWithOutbox).not.toHaveBeenCalled();
  });

  test("maps unique constraint violation to ALREADY_EXISTS", async () => {
    studentGateway.getStudent.mockResolvedValue({
      id: "student-1",
      status: "ACTIVE"
    });
    courseGateway.getCourse.mockResolvedValue({
      id: "course-1",
      status: "OPEN",
      enrolled_count: 12,
      capacity: 30
    });

    const duplicateError = new Error("duplicate key");
    duplicateError.code = "23505";
    enrollmentRepository.createEnrollmentWithOutbox.mockRejectedValue(
      duplicateError
    );

    await expect(
      service.createEnrollment({
        student_id: "student-1",
        course_id: "course-1"
      })
    ).rejects.toMatchObject({
      code: "ALREADY_EXISTS",
      message: "Student already enrolled in course"
    });
  });

  test("rejects missing student_id before calling gRPC gateways", async () => {
    await expect(
      service.createEnrollment({
        student_id: "",
        course_id: "course-1"
      })
    ).rejects.toMatchObject({
      code: "INVALID_ARGUMENT",
      message: "Student id is required"
    });

    expect(studentGateway.getStudent).not.toHaveBeenCalled();
    expect(courseGateway.getCourse).not.toHaveBeenCalled();
  });
});

describe("enrollment-service list helpers", () => {
  test("returns enrollments and id lists from repository", async () => {
    const { enrollmentRepository, service } = createServiceContext();
    const enrollments = [
      {
        id: "enrollment-1",
        student_id: "student-1",
        course_id: "course-1",
        status: "CONFIRMED"
      }
    ];

    enrollmentRepository.findByStudentId.mockResolvedValue(enrollments);
    enrollmentRepository.findCourseIdsByStudentId.mockResolvedValue(["course-1"]);
    enrollmentRepository.findStudentIdsByCourseId.mockResolvedValue(["student-1"]);

    await expect(
      service.listEnrollmentsByStudent({ student_id: "student-1" })
    ).resolves.toEqual(enrollments);
    await expect(
      service.listStudentCourseIds({ student_id: "student-1" })
    ).resolves.toEqual({ course_ids: ["course-1"] });
    await expect(
      service.listCourseStudentIds({ course_id: "course-1" })
    ).resolves.toEqual({ student_ids: ["student-1"] });
  });
});
