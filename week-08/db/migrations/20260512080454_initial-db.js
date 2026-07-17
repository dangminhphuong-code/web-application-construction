/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("students", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("email").notNullable().unique();
    table.string("password").notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("courses", (table) => {
    table.increments("id").primary();
    table.string("title").notNullable();
    table.text("description");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("enrollments", (table) => {
    table.increments("id").primary();
    table.integer("student_id").unsigned().notNullable().references("id").inTable("students").onDelete("CASCADE");
    table.integer("course_id").unsigned().notNullable().references("id").inTable("courses").onDelete("CASCADE");
    table.timestamps(true, true);
    table.unique(["student_id", "course_id"]);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("enrollments");
  await knex.schema.dropTableIfExists("courses");
  await knex.schema.dropTableIfExists("students");
}