import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (!token) return scheme;

  if (scheme.toLowerCase() !== "bearer") return null;

  return token;
}

export function createToken(student) {
  return jwt.sign(
    {
      sub: student.id,
      email: student.email
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN
    }
  );
}

export function getCurrentStudentId(authorizationHeader) {
  const token = getBearerToken(authorizationHeader);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
}

export function requireAuth(context) {
  if (!context.currentStudentId) {
    throw new GraphQLError("Authentication required", {
      extensions: {
        code: "UNAUTHENTICATED"
      }
    });
  }

  return context.currentStudentId;
}
