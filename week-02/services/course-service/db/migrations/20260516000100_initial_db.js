export async function up(knex) {
  await knex.schema.createTable("courses", (table) => {
    table.string("id").primary();
    table.string("title").notNullable().unique();
    table.text("description");
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("courses");
}
