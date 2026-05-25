const TABLE_NAME = "courses";

function toCourse(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    title: row.title,
    description: row.description || ""
  };
}

export function createCourseRepository(db) {
  return {
    async create(course) {
      await db(TABLE_NAME).insert(course);
      return this.findById(course.id);
    },

    async findById(id) {
      const row = await db(TABLE_NAME)
        .select("id", "title", "description")
        .where({ id })
        .first();

      return toCourse(row);
    },

    async findByTitle(title) {
      const row = await db(TABLE_NAME)
        .select("id", "title", "description")
        .where({ title })
        .first();

      return toCourse(row);
    },

    async findAll({ limit, offset }) {
      const rows = await db(TABLE_NAME)
        .select("id", "title", "description")
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);

      return rows.map(toCourse);
    },

    async countAll() {
      const row = await db(TABLE_NAME).count({ count: "*" }).first();
      return Number(row.count);
    },

    async findByIds(ids) {
      if (!ids || ids.length === 0) return [];

      const rows = await db(TABLE_NAME)
        .select("id", "title", "description")
        .whereIn("id", ids);

      return rows.map(toCourse);
    }
  };
}
