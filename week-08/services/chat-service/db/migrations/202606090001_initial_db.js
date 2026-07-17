export async function up(knex) {
  await knex.schema.createTable("conversations", (table) => {
    table.uuid("id").primary();
    table.string("type", 30).notNullable().defaultTo("direct");
    table.string("direct_key", 100).unique().nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("conversation_participants", (table) => {
    table
      .uuid("conversation_id")
      .notNullable()
      .references("id")
      .inTable("conversations")
      .onDelete("CASCADE");
    table.uuid("student_id").notNullable();
    table.timestamps(true, true);
    table.primary(["conversation_id", "student_id"]);
    table.index(["student_id"]);
  });

  await knex.schema.createTable("messages", (table) => {
    table.uuid("id").primary();
    table
      .uuid("conversation_id")
      .notNullable()
      .references("id")
      .inTable("conversations")
      .onDelete("CASCADE");
    table.uuid("sender_student_id").notNullable();
    table.text("content").notNullable();
    table.timestamps(true, true);
    table.index(["conversation_id", "created_at"]);
    table.index(["sender_student_id"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("messages");
  await knex.schema.dropTableIfExists("conversation_participants");
  await knex.schema.dropTableIfExists("conversations");
}

