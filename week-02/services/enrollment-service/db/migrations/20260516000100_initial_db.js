export async function up(knex) {
  await knex.schema.createTable("enrollments", (table) => {
    table.string("id").primary();
    table.string("student_id").notNullable();
    table.string("course_id").notNullable();
    table.timestamps(true, true);
    table.unique(["student_id", "course_id"]);
    table.index(["student_id"]);
    table.index(["course_id"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("enrollments");
}
