import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS) || 10;

function normalizePagination(limit, offset) {
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  return {
    limit: safeLimit,
    offset: safeOffset
  };
}

function buildPageInfo({ total, limit, offset }) {
  return {
    total,
    limit,
    offset,
    has_next_page: offset + limit < total,
    has_previous_page: offset > 0
  };
}

function serviceError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function toPublicStudent(student) {
  if (!student) return null;

  return {
    id: String(student.id),
    name: student.name,
    email: student.email
  };
}

export function createStudentService(studentRepository) {
  return {
    async getStudent(id) {
      const student = await studentRepository.findById(id);

      if (!student) {
        throw serviceError("Student not found", "NOT_FOUND");
      }

      return student;
    },

    async createStudent({ name, email, password }) {
      if (!name || !email || !password) {
        throw serviceError("Name, email and password are required", "INVALID_ARGUMENT");
      }

      const existing = await studentRepository.findByEmailWithPassword(email);
      if (existing) {
        throw serviceError("Email already exists", "ALREADY_EXISTS");
      }

      const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
      const student = {
        id: crypto.randomUUID(),
        name,
        email,
        password: passwordHash
      };

      return studentRepository.create(student);
    },

    async authenticateStudent({ email, password }) {
      const student = await studentRepository.findByEmailWithPassword(email);

      if (!student) {
        return {
          success: false,
          student: null,
          message: "Invalid email or password"
        };
      }

      const valid = await bcrypt.compare(password, student.password);

      if (!valid) {
        return {
          success: false,
          student: null,
          message: "Invalid email or password"
        };
      }

      return {
        success: true,
        student: toPublicStudent(student),
        message: "Authenticated"
      };
    },

    async listStudents({ limit, offset }) {
      const pagination = normalizePagination(limit, offset);
      const [students, total] = await Promise.all([
        studentRepository.findAll(pagination),
        studentRepository.countAll()
      ]);

      return {
        students,
        page_info: buildPageInfo({
          total,
          limit: pagination.limit,
          offset: pagination.offset
        })
      };
    },

    async batchGetStudents(ids) {
      const uniqueIds = [...new Set((ids || []).filter(Boolean).map(String))];
      const students = await studentRepository.findByIds(uniqueIds);
      const studentMap = new Map(students.map((student) => [student.id, student]));

      return uniqueIds.map((id) => studentMap.get(id)).filter(Boolean);
    }
  };
}
