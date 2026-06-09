import { readFile } from "node:fs/promises";
import { hashPassword } from "../../auth.js";

const seedDataUrl = new URL("./data.json", import.meta.url);

async function loadSeedData() {
  const rawData = await readFile(seedDataUrl, "utf8");
  return JSON.parse(rawData);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const { students, courses, enrollments } = await loadSeedData();

  const studentRows = students.map((student) => ({
    ...student,
    password: hashPassword(student.password),
  }));

  await knex.transaction(async (trx) => {
    await trx("enrollments").del();
    await trx("students").del();
    await trx("courses").del();

    const insertedStudents = await trx("students").insert(studentRows).returning("*");
    const insertedCourses = await trx("courses").insert(courses).returning("*");

    const studentsByEmail = new Map(insertedStudents.map((student) => [student.email, student]));
    const coursesByTitle = new Map(insertedCourses.map((course) => [course.title, course]));

    const enrollmentRows = enrollments.map(({ studentEmail, courseTitle }) => {
      const student = studentsByEmail.get(studentEmail);
      const course = coursesByTitle.get(courseTitle);
      
      if (!student || !course) {
        throw new Error(`Invalid enrollment seed: ${studentEmail} -> ${courseTitle}`);
      }
      return {
        student_id: student.id,
        course_id: course.id,
      };
    });

    if (enrollmentRows.length > 0) {
      await trx("enrollments").insert(enrollmentRows);
    }
  });
}