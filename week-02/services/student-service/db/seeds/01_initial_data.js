import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import "dotenv/config";

const seedDataUrl = new URL("./data.json", import.meta.url);
const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS) || 10;

async function loadSeedData() {
  const rawData = await readFile(seedDataUrl, "utf8");
  return JSON.parse(rawData);
}

export async function seed(knex) {
  const students = await loadSeedData();
  const studentRows = students.map((student) => ({
    ...student,
    password: bcrypt.hashSync(student.password, PASSWORD_SALT_ROUNDS)
  }));

  await knex.transaction(async (trx) => {
    await trx("students").del();

    if (studentRows.length > 0) {
      await trx("students").insert(studentRows);
    }
  });
}
