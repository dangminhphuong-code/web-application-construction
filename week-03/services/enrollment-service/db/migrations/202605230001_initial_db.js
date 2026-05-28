export async function up(knex) {
  await knex.schema.createTable("enrollments", (table) => {
    table.increments("id").primary();
    table.string("student_id", 36).notNullable();
    table.integer("course_id").notNullable();
    table.string("status", 30).notNullable().defaultTo("CONFIRMED");
    table.timestamps(true, true);
    table.unique(["student_id", "course_id"]);
  });

  await knex.schema.createTable("outbox_events", (table) => {
    table.string("event_id", 100).primary();
    table.string("event_type", 100).notNullable();
    table.string("aggregate_type", 100).notNullable();
    table.integer("aggregate_id").notNullable();
    table.jsonb("payload").notNullable();
    table.string("status", 30).notNullable().defaultTo("PENDING");
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("last_error");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("processed_at");
  });

  await knex.schema.raw(
    "CREATE INDEX outbox_events_status_attempts_idx ON outbox_events(status, attempts)"
  );
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("outbox_events");
  await knex.schema.dropTableIfExists("enrollments");
}
