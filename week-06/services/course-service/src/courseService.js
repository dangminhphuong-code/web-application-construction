import * as courseCache from "./courseCache.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const INSTANCE_NAME = process.env.INSTANCE_NAME || "course-service";

function normalizePagination(limit, offset) {
  return {
    limit: Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT),
    offset: Math.max(Number(offset) || 0, 0)
  };
}

function normalizeTopCourseLimit(limit) {
  return Math.min(Math.max(Number(limit) || 10, 1), MAX_LIMIT);
}

function buildPageInfo({ total, limit, offset }) {
  return {
    total,
    limit,
    offset,
    has_next_page: offset + limit < total,
    has_previous_page: offset > 0
  };
}

function ensureRequired(value, message) {
  if (!value || !String(value).trim()) {
    const error = new Error(message);
    error.code = "INVALID_ARGUMENT";
    throw error;
  }
}

function normalizeId(value, fieldName) {
  ensureRequired(value, `${fieldName} is required`);
  return String(value).trim();
}

function attachInstanceName(course) {
  if (!course) return course;

  return {
    ...course,
    instance_name: INSTANCE_NAME
  };
}

function attachInstanceNameToCourses(courses) {
  return courses.map(attachInstanceName);
}

function normalizeEnrollmentConfirmed(input = {}) {
  const payload = input.payload || {};
  const eventId = input.event_id || input.eventId;
  const eventType = input.event_type || input.eventType;
  const correlationId = input.correlation_id || input.correlationId || null;

  if (!eventId) {
    const error = new Error("event_id is required");
    error.code = "INVALID_ARGUMENT";
    throw error;
  }

  if (eventType && eventType !== "EnrollmentConfirmed") {
    const error = new Error("Unsupported event type");
    error.code = "INVALID_ARGUMENT";
    throw error;
  }

  return {
    eventId,
    enrollmentId: normalizeId(
      input.enrollment_id || input.enrollmentId || payload.enrollmentId,
      "enrollment_id"
    ),
    studentId: normalizeId(
      input.student_id || input.studentId || payload.studentId,
      "student_id"
    ),
    courseId: normalizeId(
      input.course_id || input.courseId || payload.courseId,
      "course_id"
    ),
    correlationId
  };
}

async function loadTopCoursesFromCache(courseRepository, limit) {
  const ids = await courseCache.getTopCourseIds(limit);
  if (!ids.length) {
    return { courses: [], hasStaleIds: false };
  }

  const courses = await courseRepository.findByIds(ids);
  const coursesById = new Map(courses.map((course) => [course.id, course]));
  const orderedCourses = ids.map((id) => coursesById.get(id)).filter(Boolean);

  return {
    courses: orderedCourses,
    hasStaleIds: orderedCourses.length !== ids.length
  };
}

async function rebuildTopCourseIndex(courseRepository) {
  const courseScores = await courseRepository.findAllCourseScores();
  await courseCache.rebuildTopCourseIndex(courseScores);
}

export function createCourseService(courseRepository) {
  return {
    async getCourse({ id }) {
      const courseId = normalizeId(id, "Course id");
      const cachedCourse = await courseCache.getCachedCourse(courseId);

      if (cachedCourse) return attachInstanceName(cachedCourse);

      const course = await courseRepository.findById(courseId);
      if (!course) {
        const error = new Error("Course not found");
        error.code = "NOT_FOUND";
        throw error;
      }

      await courseCache.setCachedCourse(course);
      return attachInstanceName(course);
    },

    async batchGetCourses({ ids = [] }) {
      const courseIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
      const courses = await courseRepository.findByIds(courseIds);

      return {
        courses: attachInstanceNameToCourses(courses),
        instance_name: INSTANCE_NAME
      };
    },

    async listCourses({ limit, offset }) {
      const pagination = normalizePagination(limit, offset);
      const [courses, total] = await Promise.all([
        courseRepository.findAll(pagination),
        courseRepository.countAll()
      ]);

      return {
        courses: attachInstanceNameToCourses(courses),
        page_info: buildPageInfo({ total, ...pagination }),
        instance_name: INSTANCE_NAME
      };
    },

    async listTopCourses({ limit } = {}) {
      const safeLimit = normalizeTopCourseLimit(limit);

      if (!(await courseCache.isTopCourseIndexReady())) {
        await rebuildTopCourseIndex(courseRepository);
      }

      let cachedResult = await loadTopCoursesFromCache(
        courseRepository,
        safeLimit
      );

      if (cachedResult.hasStaleIds) {
        await rebuildTopCourseIndex(courseRepository);
        cachedResult = await loadTopCoursesFromCache(
          courseRepository,
          safeLimit
        );
      }

      const courses = cachedResult.courses.length
        ? cachedResult.courses
        : await courseRepository.findTopByEnrolledCount(safeLimit);

      return {
        courses: attachInstanceNameToCourses(courses),
        instance_name: INSTANCE_NAME
      };
    },

    async createCourse({ title, description = "", capacity = 50 }) {
      ensureRequired(title, "Course title is required");

      const course = await courseRepository.createCourse({
        title: title.trim(),
        description: description ? description.trim() : "",
        capacity: Math.max(Number(capacity) || 50, 1)
      });

      await Promise.all([
        courseCache.setCachedCourse(course),
        courseCache.updateTopCourseScore(course)
      ]);

      return attachInstanceName(course);
    },

    async applyEnrollmentConfirmed(request) {
      const event = normalizeEnrollmentConfirmed(request);
      const result = await courseRepository.applyEnrollmentConfirmed(event);

      if (result.alreadyProcessed) {
        return {
          success: true,
          duplicated: true,
          message: "Event already processed",
          instance_name: INSTANCE_NAME
        };
      }

      await Promise.all([
        courseCache.setCachedCourse(result.course),
        courseCache.updateTopCourseScore(result.course)
      ]);

      return {
        success: true,
        duplicated: false,
        message: `Enrollment ${event.enrollmentId} applied to course ${event.courseId}`,
        course: attachInstanceName(result.course),
        emitted_event_id: result.emittedEventId,
        instance_name: INSTANCE_NAME
      };
    }
  };
}