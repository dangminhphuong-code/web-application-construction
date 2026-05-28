import bcrypt from "bcryptjs";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const PASSWORD_SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 10);

function normalizePagination(limit, offset) {
  return {
    limit: Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT),
    offset: Math.max(Number(offset) || 0, 0)
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

function ensureRequired(value, message) {
  if (!value || !String(value).trim()) {
    const error = new Error(message);
    error.code = "INVALID_ARGUMENT";
    throw error;
  }
}

export function createStudentService(studentRepository) {
  return {
    async getStudent({ id }) {
      ensureRequired(id, "Student id is required");

      const student = await studentRepository.findById(id);
      if (!student) {
        const error = new Error("Student not found");
        error.code = "NOT_FOUND";
        throw error;
      }

      return student;
    },

    async batchGetStudents({ ids = [] }) {
      const cleanIds = [...new Set(ids.map(String).filter(Boolean))];
      const students = await studentRepository.findByIds(cleanIds);

      return {
        students
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
        page_info: buildPageInfo({ total, ...pagination })
      };
    },

    async authenticateStudent({ email, password }) {
      ensureRequired(email, "Email is required");
      ensureRequired(password, "Password is required");

      const student = await studentRepository.findByEmail(email);
      if (!student || !bcrypt.compareSync(password, student.password)) {
        return { success: false, student: null };
      }

      return {
        success: true,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          status: student.status
        }
      };
    },

    async createStudent({ name, email, password }) {
      ensureRequired(name, "Name is required");
      ensureRequired(email, "Email is required");
      ensureRequired(password, "Password is required");

      const existing = await studentRepository.findByEmail(email);
      if (existing) {
        const error = new Error("Email already exists");
        error.code = "ALREADY_EXISTS";
        throw error;
      }

      return studentRepository.createStudent({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: bcrypt.hashSync(password, PASSWORD_SALT_ROUNDS)
      });
    }
  };
}
