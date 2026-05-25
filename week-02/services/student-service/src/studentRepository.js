const TABLE_NAME = "students";

function toStudent(row) {
  if (!row) return null;

  return {
    id: String(row.id),
    name: row.name,
    email: row.email
  };
}

export function createStudentRepository(db) {
  return {
    async create(student) {
      await db(TABLE_NAME).insert(student);
      return this.findById(student.id);
    },

    async findById(id) {
      const row = await db(TABLE_NAME)
        .select("id", "name", "email")
        .where({ id })
        .first();

      return toStudent(row);
    },

    async findByEmailWithPassword(email) {
      return db(TABLE_NAME)
        .select("id", "name", "email", "password")
        .where({ email })
        .first();
    },

    async findAll({ limit, offset }) {
      const rows = await db(TABLE_NAME)
        .select("id", "name", "email")
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);

      return rows.map(toStudent);
    },

    async countAll() {
      const row = await db(TABLE_NAME).count({ count: "*" }).first();
      return Number(row.count);
    },

    async findByIds(ids) {
      if (!ids || ids.length === 0) return [];

      const rows = await db(TABLE_NAME)
        .select("id", "name", "email")
        .whereIn("id", ids);

      return rows.map(toStudent);
    }
  };
}
