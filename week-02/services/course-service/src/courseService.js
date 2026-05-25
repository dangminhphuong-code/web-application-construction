import crypto from "node:crypto";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizePagination(limit, offset) {
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  return {
    limit: safeLimit,
    offset: safeOffset
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

function serviceError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function createCourseService(courseRepository) {
  return {
    async getCourse(id) {
      const course = await courseRepository.findById(id);

      if (!course) {
        throw serviceError("Course not found", "NOT_FOUND");
      }

      return course;
    },

    async createCourse({ title, description }) {
      if (!title) {
        throw serviceError("Title is required", "INVALID_ARGUMENT");
      }

      const existing = await courseRepository.findByTitle(title);
      if (existing) {
        throw serviceError("Course already exists", "ALREADY_EXISTS");
      }

      const course = {
        id: crypto.randomUUID(),
        title,
        description: description || null
      };

      return courseRepository.create(course);
    },

    async listCourses({ limit, offset }) {
      const pagination = normalizePagination(limit, offset);
      const [courses, total] = await Promise.all([
        courseRepository.findAll(pagination),
        courseRepository.countAll()
      ]);

      return {
        courses,
        page_info: buildPageInfo({
          total,
          limit: pagination.limit,
          offset: pagination.offset
        })
      };
    },

    async batchGetCourses(ids) {
      const uniqueIds = [...new Set((ids || []).filter(Boolean).map(String))];
      const courses = await courseRepository.findByIds(uniqueIds);
      const courseMap = new Map(courses.map((course) => [course.id, course]));

      return uniqueIds.map((id) => courseMap.get(id)).filter(Boolean);
    }
  };
}
