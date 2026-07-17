import crypto from "node:crypto";

const TABLE_NAME = "courses";
const PROCESSED_EVENTS_TABLE = "processed_events";
const OUTBOX_TABLE = "outbox_events";
const COURSE_COLUMNS = [
  "id",
  "title",
  "description",
  "status",
  "enrolled_count",
  "capacity"
];

export function createCourseRepository(db) {
  return {
    async findById(id) {
      return db(TABLE_NAME).select(COURSE_COLUMNS).where({ id }).first();
    },

    async findByIds(ids) {
      if (!ids.length) return [];

      return db(TABLE_NAME).select(COURSE_COLUMNS).whereIn("id", ids);
    },

    async findAll({ limit, offset }) {
      return db(TABLE_NAME)
        .select(COURSE_COLUMNS)
        .orderBy("id", "asc")
        .limit(limit)
        .offset(offset);
    },

    async findAllCourseScores() {
      return db(TABLE_NAME).select("id", "enrolled_count");
    },

    async findTopByEnrolledCount(limit) {
      return db(TABLE_NAME)
        .select(COURSE_COLUMNS)
        .orderBy("enrolled_count", "desc")
        .orderBy("id", "asc")
        .limit(limit);
    },

    async countAll() {
      const row = await db(TABLE_NAME).count({ count: "*" }).first();
      return Number(row.count);
    },

    async createCourse({ title, description, capacity }) {
      const [course] = await db(TABLE_NAME)
        .insert({
          id: crypto.randomUUID(),
          title,
          description,
          capacity,
          status: "OPEN"
        })
        .returning(COURSE_COLUMNS);

      return course;
    },

    async applyEnrollmentConfirmed({
      eventId,
      enrollmentId,
      studentId,
      courseId,
      correlationId = null
    }) {
      return db.transaction(async (trx) => {
        const insertedEvents = await trx(PROCESSED_EVENTS_TABLE)
          .insert({
            event_id: eventId,
            event_type: "EnrollmentConfirmed",
            processed_at: trx.fn.now()
          })
          .onConflict("event_id")
          .ignore()
          .returning("event_id");

        if (insertedEvents.length === 0) {
          return {
            alreadyProcessed: true,
            enrollmentId,
            studentId,
            courseId
          };
        }

        const course = await trx(TABLE_NAME)
          .where({ id: courseId })
          .forUpdate()
          .first();

        if (!course) {
          const error = new Error("Course not found");
          error.code = "NOT_FOUND";
          throw error;
        }

        if (course.status !== "OPEN") {
          const error = new Error("Course is not open for enrollment");
          error.code = "FAILED_PRECONDITION";
          throw error;
        }

        if (Number(course.enrolled_count) >= Number(course.capacity)) {
          const error = new Error("Course capacity has been reached");
          error.code = "FAILED_PRECONDITION";
          throw error;
        }

        await trx(TABLE_NAME)
          .where({ id: courseId })
          .update({
            enrolled_count: Number(course.enrolled_count) + 1,
            updated_at: trx.fn.now()
          });

        const updatedCourse = await trx(TABLE_NAME)
          .select(COURSE_COLUMNS)
          .where({ id: courseId })
          .first();
        const courseEventId = crypto.randomUUID();

        await trx(OUTBOX_TABLE).insert({
          id: courseEventId,
          event_type: "CourseEnrollmentCountIncreased",
          routing_key: "course.enrolled_count.increased",
          version: 1,
          correlation_id: correlationId,
          payload: {
            courseId: updatedCourse.id,
            courseTitle: updatedCourse.title,
            enrolledCount: updatedCourse.enrolled_count,
            incrementBy: 1,
            enrollmentId,
            studentId
          },
          status: "pending",
          attempts: 0
        });

        return {
          alreadyProcessed: false,
          enrollmentId,
          studentId,
          courseId,
          course: updatedCourse,
          emittedEventId: courseEventId
        };
      });
    }
  };
}