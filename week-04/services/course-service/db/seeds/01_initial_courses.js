export async function seed(knex) {
  await knex("courses")
    .insert([
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
        title: "Web Application Construction",
        description: "Build Node.js web applications with REST, GraphQL and microservices.",
        status: "OPEN",
        enrolled_count: 0,
        capacity: 50
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
        title: "Database Systems",
        description: "Relational database design, SQL and transaction processing.",
        status: "OPEN",
        enrolled_count: 0,
        capacity: 40
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
        title: "Distributed Systems",
        description: "Service communication, consistency patterns and resilience.",
        status: "OPEN",
        enrolled_count: 0,
        capacity: 35
      }
    ])
    .onConflict("id")
    .merge(["title", "description", "status", "capacity"]);
}
