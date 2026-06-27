import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const courseCache = {
  getCachedCourse: jest.fn(),
  setCachedCourse: jest.fn(),
  invalidateCachedCourse: jest.fn(),
  isTopCourseIndexReady: jest.fn(),
  rebuildTopCourseIndex: jest.fn(),
  getTopCourseIds: jest.fn(),
  updateTopCourseScore: jest.fn(),
  pingRedis: jest.fn(),
  closeRedis: jest.fn()
};

jest.unstable_mockModule("../src/courseCache.js", () => courseCache);

const { createCourseService } = await import("../src/courseService.js");

function createMockRepository() {
  return {
    findById: jest.fn(),
    findByIds: jest.fn(),
    findAll: jest.fn(),
    findAllCourseScores: jest.fn(),
    findTopByEnrolledCount: jest.fn(),
    countAll: jest.fn(),
    createCourse: jest.fn(),
    applyEnrollmentConfirmed: jest.fn()
  };
}

function createCourse(overrides = {}) {
  return {
    id: "course-1",
    title: "Distributed Systems",
    description: "Microservices and messaging",
    status: "OPEN",
    enrolled_count: 12,
    capacity: 30,
    ...overrides
  };
}

function createEnrollmentConfirmedEvent(overrides = {}) {
  return {
    event_id: "event-1",
    event_type: "EnrollmentConfirmed",
    correlation_id: "correlation-1",
    payload: {
      enrollmentId: "enrollment-1",
      courseId: "course-1",
      studentId: "student-1"
    },
    ...overrides
  };
}

describe("course-service getCourse", () => {
  let repository;
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = createMockRepository();
    service = createCourseService(repository);
  });

  test("returns cached course without querying repository", async () => {
    const cachedCourse = createCourse();
    courseCache.getCachedCourse.mockResolvedValue(cachedCourse);

    await expect(service.getCourse({ id: "course-1" })).resolves.toMatchObject({
      ...cachedCourse,
      instance_name: "course-service"
    });

    expect(repository.findById).not.toHaveBeenCalled();
    expect(courseCache.setCachedCourse).not.toHaveBeenCalled();
  });

  test("loads course from repository and writes it to cache on cache miss", async () => {
    const course = createCourse();
    courseCache.getCachedCourse.mockResolvedValue(null);
    repository.findById.mockResolvedValue(course);

    await expect(service.getCourse({ id: "course-1" })).resolves.toMatchObject({
      ...course,
      instance_name: "course-service"
    });

    expect(repository.findById).toHaveBeenCalledWith("course-1");
    expect(courseCache.setCachedCourse).toHaveBeenCalledWith(course);
  });

  test("throws NOT_FOUND when course does not exist", async () => {
    courseCache.getCachedCourse.mockResolvedValue(null);
    repository.findById.mockResolvedValue(null);

    await expect(service.getCourse({ id: "course-missing" })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Course not found"
    });

    expect(courseCache.setCachedCourse).not.toHaveBeenCalled();
  });
});

describe("course-service Redis cache for top courses", () => {
  let repository;
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = createMockRepository();
    service = createCourseService(repository);
  });

  test("uses Redis top-course index and preserves cached ordering", async () => {
    const first = createCourse({ id: "course-1", enrolled_count: 20 });
    const second = createCourse({ id: "course-2", enrolled_count: 30 });

    courseCache.isTopCourseIndexReady.mockResolvedValue(true);
    courseCache.getTopCourseIds.mockResolvedValue(["course-2", "course-1"]);
    repository.findByIds.mockResolvedValue([first, second]);

    await expect(service.listTopCourses({ limit: 2 })).resolves.toEqual({
      courses: [
        { ...second, instance_name: "course-service" },
        { ...first, instance_name: "course-service" }
      ],
      instance_name: "course-service"
    });

    expect(repository.findTopByEnrolledCount).not.toHaveBeenCalled();
  });

  test("rebuilds Redis top-course index before reading when index is not ready", async () => {
    const courseScores = [{ id: "course-1", enrolled_count: 12 }];
    const topCourse = createCourse();

    courseCache.isTopCourseIndexReady.mockResolvedValue(false);
    repository.findAllCourseScores.mockResolvedValue(courseScores);
    courseCache.getTopCourseIds.mockResolvedValue(["course-1"]);
    repository.findByIds.mockResolvedValue([topCourse]);

    await service.listTopCourses({ limit: 1 });

    expect(repository.findAllCourseScores).toHaveBeenCalledTimes(1);
    expect(courseCache.rebuildTopCourseIndex).toHaveBeenCalledWith(courseScores);
  });
});

describe("course-service applyEnrollmentConfirmed", () => {
  let repository;
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = createMockRepository();
    service = createCourseService(repository);
  });

  test("updates enrolled count from EnrollmentConfirmed event and refreshes cache", async () => {
    const updatedCourse = createCourse({ enrolled_count: 13 });
    repository.applyEnrollmentConfirmed.mockResolvedValue({
      alreadyProcessed: false,
      enrollmentId: "enrollment-1",
      studentId: "student-1",
      courseId: "course-1",
      course: updatedCourse,
      emittedEventId: "course-event-1"
    });

    await expect(
      service.applyEnrollmentConfirmed(createEnrollmentConfirmedEvent())
    ).resolves.toEqual({
      success: true,
      duplicated: false,
      message: "Enrollment enrollment-1 applied to course course-1",
      course: { ...updatedCourse, instance_name: "course-service" },
      emitted_event_id: "course-event-1",
      instance_name: "course-service"
    });

    expect(courseCache.setCachedCourse).toHaveBeenCalledWith(updatedCourse);
    expect(courseCache.updateTopCourseScore).toHaveBeenCalledWith(updatedCourse);
  });

  test("does not update caches when enrollment event is duplicated", async () => {
    repository.applyEnrollmentConfirmed.mockResolvedValue({
      alreadyProcessed: true,
      enrollmentId: "enrollment-1",
      studentId: "student-1",
      courseId: "course-1"
    });

    await expect(
      service.applyEnrollmentConfirmed(createEnrollmentConfirmedEvent())
    ).resolves.toMatchObject({
      success: true,
      duplicated: true,
      message: "Event already processed"
    });

    expect(courseCache.setCachedCourse).not.toHaveBeenCalled();
    expect(courseCache.updateTopCourseScore).not.toHaveBeenCalled();
  });

  test("rejects invalid enrollment events before touching repository or cache", async () => {
    await expect(
      service.applyEnrollmentConfirmed(
        createEnrollmentConfirmedEvent({
          event_type: "EnrollmentCancelled"
        })
      )
    ).rejects.toMatchObject({
      code: "INVALID_ARGUMENT",
      message: "Unsupported event type"
    });

    expect(repository.applyEnrollmentConfirmed).not.toHaveBeenCalled();
    expect(courseCache.setCachedCourse).not.toHaveBeenCalled();
  });
});
