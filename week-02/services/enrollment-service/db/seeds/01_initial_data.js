import { readFile } from "node:fs/promises";

const seedDataUrl = new URL("./data.json", import.meta.url);

async function loadSeedData() {
  const rawData = await readFile(seedDataUrl, "utf8");
  return JSON.parse(rawData);
}

export async function seed(knex) {
  const enrollments = await loadSeedData();

  await knex.transaction(async (trx) => {
    await trx("enrollments").del();

    if (enrollments.length > 0) {
      await trx("enrollments").insert(enrollments);
    }
  });
}
