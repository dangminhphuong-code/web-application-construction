import crypto from "node:crypto";

const TABLE_NAME = "students";
const STUDENT_COLUMNS = ["id", "name", "email", "status"];

export function createStudentRepository(db) {
  return {
    async findById(id) {
      return db(TABLE_NAME).select(STUDENT_COLUMNS).where({ id }).first();
    },

    async findByIds(ids) {
      if (!ids.length) return [];

      return db(TABLE_NAME)
        .select(STUDENT_COLUMNS)
        .whereIn("id", ids);
    },

    async findByEmail(email) {
      return db(TABLE_NAME).where({ email }).first();
    },

    async findAll({ limit, offset }) {
      return db(TABLE_NAME)
        .select(STUDENT_COLUMNS)
        .orderBy("created_at", "asc")
        .limit(limit)
        .offset(offset);
    },

    async countAll() {
      const row = await db(TABLE_NAME).count({ count: "*" }).first();
      return Number(row.count);
    },

    async createStudent({ name, email, passwordHash }) {
      const [student] = await db(TABLE_NAME)
        .insert({
          id: crypto.randomUUID(),
          name,
          email,
          password: passwordHash,
          status: "ACTIVE"
        })
        .returning(STUDENT_COLUMNS);

      return student;
    }
  };
}
