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

export function createCourseService(courseRepository) {
  return {
    async getCourse({ id }) {
      const courseId = Number(id);
      if (!courseId) {
        const error = new Error("Course id is required");
        error.code = "INVALID_ARGUMENT";
        throw error;
      }

      const course = await courseRepository.findById(courseId);
      if (!course) {
        const error = new Error("Course not found");
        error.code = "NOT_FOUND";
        throw error;
      }

      return course;
    },

    async batchGetCourses({ ids = [] }) {
      const courseIds = [...new Set(ids.map(Number).filter(Boolean))];
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
      const result = await courseRepository.applyEnrollmentConfirmed({
        eventId: request.event_id,
        enrollmentId: request.enrollment_id,
        studentId: request.student_id,
        courseId: request.course_id
      });

      if (result.alreadyProcessed) {
        return {
          success: true,
          message: "Event already processed"
        };
      }

      return {
        success: true,
        message: "Enrollment confirmed event applied"
      };
    }
  };
}
