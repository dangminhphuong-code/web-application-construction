const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizePagination(limit, offset) {
  return {
    limit: Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT),
    offset: Math.max(Number(offset) || 0, 0)
  };
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

export function createCourseService(courseRepository) {
  return {
    async getCourse({ id }) {
      const courseId = normalizeId(id, "Course id");

      const course = await courseRepository.findById(courseId);
      if (!course) {
        const error = new Error("Course not found");
        error.code = "NOT_FOUND";
        throw error;
      }

      return course;
    },

    async batchGetCourses({ ids = [] }) {
      const courseIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
      const courses = await courseRepository.findByIds(courseIds);

      return {
        courses
      };
    },

    async listCourses({ limit, offset }) {
      const pagination = normalizePagination(limit, offset);
      const [courses, total] = await Promise.all([
        courseRepository.findAll(pagination),
        courseRepository.countAll()
      ]);

      return {
        courses,
        page_info: buildPageInfo({ total, ...pagination })
      };
    },

    async createCourse({ title, description = "", capacity = 50 }) {
      ensureRequired(title, "Course title is required");

      const safeCapacity = Math.max(Number(capacity) || 50, 1);

      return courseRepository.createCourse({
        title: title.trim(),
        description: description ? description.trim() : "",
        capacity: safeCapacity
      });
    },

    async applyEnrollmentConfirmed(request) {
      const event = normalizeEnrollmentConfirmed(request);
      const result = await courseRepository.applyEnrollmentConfirmed(event);

      if (result.alreadyProcessed) {
        return {
          success: true,
          duplicated: true,
          message: "Event already processed"
        };
      }

      return {
        success: true,
        duplicated: false,
        message: "Enrollment confirmed event applied",
        emittedEventId: result.emittedEventId
      };
    }
  };
}
