import { GraphQLError } from "graphql";
import { createToken, requireAuth, verifyPassword, hashPassword } from "./auth.js";
import { db as defaultDb } from "./db/db.js";

const COURSES_TABLE = "courses";
const STUDENTS_TABLE = "students";
const ENROLLMENTS_TABLE = "enrollments";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function getDb(context) {
  return context?.db || defaultDb;
}

function getPagination({ limit, offset } = {}) {
  return {
    limit: Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT),
    offset: Math.max(offset ?? 0, 0),
  };
}

function coursesQuery(db) {
  return db(COURSES_TABLE).select("*").orderBy("id");
}

function studentsQuery(db) {
  return db(STUDENTS_TABLE).select("*").orderBy("id");
}

function applyPagination(query, args) {
  const { limit, offset } = getPagination(args);
  return query.limit(limit).offset(offset);
}

async function toPage(query, args) {
  const { limit, offset } = getPagination(args);
  const countQuery = query.clone().clearSelect().clearOrder().count("* as count").first();
  const itemsQuery = query.clone().limit(limit).offset(offset);

  const [countResult, items] = await Promise.all([countQuery, itemsQuery]);
  const total = Number(countResult?.count || 0);

  return {
    items,
    pageInfo: {
      total,
      limit,
      offset,
      hasNextPage: offset + items.length < total,
      hasPreviousPage: offset > 0,
    },
  };
}

function invalidCredentialsError() {
  return new GraphQLError("Invalid email or password", {
    extensions: { code: "UNAUTHENTICATED" },
  });
}

export const resolvers = {
  Query: {
    courses: async (_, args, context) => {
      requireAuth(context);
      return applyPagination(coursesQuery(getDb(context)), args);
    },
    coursesPage: async (_, args, context) => {
      requireAuth(context);
      return toPage(coursesQuery(getDb(context)), args);
    },
    course: async (_, { id }, context) => {
      requireAuth(context);
      return getDb(context)(COURSES_TABLE).where({ id }).first();
    },
    students: async (_, args, context) => {
      return applyPagination(studentsQuery(getDb(context)), args);
    },
    studentsPage: async (_, args, context) => {
      requireAuth(context);
      return toPage(studentsQuery(getDb(context)), args);
    },
    student: async (_, { id }, context) => {
      requireAuth(context);
      return getDb(context)(STUDENTS_TABLE).where({ id }).first();
    },
  },

  Mutation: {
    login: async (_, { email, password }, context) => {
      const student = await getDb(context)(STUDENTS_TABLE).where({ email }).first();
      if (!student || !verifyPassword(password, student.password)) {
        throw invalidCredentialsError();
      }
      return { token: createToken(student), student };
    },
    createCourse: async (_, { input }, context) => {
      requireAuth(context);
      const [course] = await getDb(context)(COURSES_TABLE)
        .insert({ title: input.title, description: input.description ?? null })
        .returning("*");
      return course;
    },
    createStudent: async (_, { input }, context) => {
      const db = getDb(context);
      const existingStudent = await db(STUDENTS_TABLE).where({ email: input.email }).first();
      if (existingStudent) throw new GraphQLError("Email already exists");

      const [student] = await db(STUDENTS_TABLE)
        .insert({
          name: input.name,
          email: input.email,
          password: hashPassword(input.password),
        })
        .returning("*");
      return student;
    },
    enrollCourse: async (_, { courseId }, context) => {
      const currentUser = requireAuth(context);
      const db = getDb(context);
      try {
        await db(ENROLLMENTS_TABLE).insert({ student_id: currentUser.id, course_id: courseId });
        return true;
      } catch (error) {
        if (error.code === '23505') throw new GraphQLError("You are already enrolled in this course");
        throw new GraphQLError("Failed to enroll in course");
      }
    },
    unenrollCourse: async (_, { courseId }, context) => {
      const currentUser = requireAuth(context);
      const db = getDb(context);
      const deletedCount = await db(ENROLLMENTS_TABLE).where({ student_id: currentUser.id, course_id: courseId }).del();
      return deletedCount > 0;
    },
  },

  Student: {
    courses: async (parent, _, context) => {
      return getDb(context)("courses")
        .join("enrollments", "courses.id", "enrollments.course_id")
        .where("enrollments.student_id", parent.id);
    },
  },

  Course: {
    students: async (parent, _, context) => {
      return getDb(context)("students")
        .join("enrollments", "students.id", "enrollments.student_id")
        .where("enrollments.course_id", parent.id);
    },
  },
};
