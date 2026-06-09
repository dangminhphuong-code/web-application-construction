export async function up(knex) {
  await knex.schema.createTable("courses", (table) => {
    table.uuid("id").primary();
    table.string("title", 200).notNullable();
    table.text("description");
    table.string("status", 30).notNullable().defaultTo("OPEN");
    table.integer("enrolled_count").notNullable().defaultTo(0);
    table.integer("capacity").notNullable().defaultTo(50);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("processed_events", (table) => {
    table.string("event_id", 100).primary();
    table.string("event_type", 100).notNullable();
    table.timestamp("processed_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("outbox_events", (table) => {
    table.uuid("id").primary();
    table.string("event_type", 100).notNullable();
    table.string("routing_key", 100).notNullable();
    table.integer("version").notNullable().defaultTo(1);
    table.jsonb("payload").notNullable();
    table.string("correlation_id").nullable();
    table.string("status").notNullable().defaultTo("pending");
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("last_error").nullable();
    table.timestamp("published_at").nullable();
    table.timestamps(true, true);
    table.index(["status", "created_at"]);
    table.index(["event_type"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("outbox_events");
  await knex.schema.dropTableIfExists("processed_events");
  await knex.schema.dropTableIfExists("courses");
}
