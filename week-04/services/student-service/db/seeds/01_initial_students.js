import bcrypt from "bcryptjs";

const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 10);

export async function seed(knex) {
  const password = bcrypt.hashSync("student123", PASSWORD_SALT_ROUNDS);

  await knex("students")
    .insert([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Nguyen An",
        email: "an@example.com",
        password,
        status: "ACTIVE"
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Tran Binh",
        email: "binh@example.com",
        password,
        status: "ACTIVE"
      }
    ])
    .onConflict("email")
    .merge(["name", "password", "status", "updated_at"]);
}
