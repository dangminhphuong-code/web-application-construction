import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

const AUTH_SECRET = process.env.AUTH_SECRET || "development-secret-change-me";
const TOKEN_EXPIRES_IN = process.env.AUTH_TOKEN_EXPIRES_IN || "7d";
const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS) || 10;

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }
  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (!token) {
    return scheme;
  }
  if (scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, AUTH_SECRET);
  } catch {
    return null;
  }
}

export function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required");
  }
  return bcrypt.hashSync(password, PASSWORD_SALT_ROUNDS);
}

export function verifyPassword(password, storedPassword) {
  if (!password || !storedPassword) {
    return false;
  }
  try {
    return bcrypt.compareSync(password, storedPassword);
  } catch {
    return false;
  }
}

export function createToken(student) {
  return jwt.sign(
    {
      studentId: student.id,
      email: student.email,
    },
    AUTH_SECRET,
    {
      expiresIn: TOKEN_EXPIRES_IN,
    }
  );
}

export async function getStudentFromAuthHeader(authorizationHeader, db) {
  const token = getBearerToken(authorizationHeader);
  if (!token) {
    return null;
  }
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }
  return db("students").where({ id: payload.studentId }).first();
}

export function requireAuth(context) {
  if (!context.currentUser) {
    throw new GraphQLError("Authentication required", {
      extensions: {
        code: "UNAUTHENTICATED",
      },
    });
  }
  return context.currentUser;
}

export function requireOwnStudent(context, studentId) {
  const currentUser = requireAuth(context);
  if (String(currentUser.id) !== String(studentId)) {
    throw new GraphQLError("You can only update your own enrollments", {
      extensions: {
        code: "FORBIDDEN",
      },
    });
  }
  return currentUser;
}