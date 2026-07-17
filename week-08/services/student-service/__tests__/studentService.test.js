import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import bcrypt from "bcryptjs";

import { createStudentService } from "../src/studentService.js";

function createMockRepository() {
  return {
    findById: jest.fn(),
    findByIds: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    countAll: jest.fn(),
    createStudent: jest.fn()
  };
}

describe("student-service createStudent", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = createMockRepository();
    service = createStudentService(repository);
  });

  test("throws INVALID_ARGUMENT when registration data is missing", async () => {
    await expect(
      service.createStudent({
        name: "",
        email: "student@example.com",
        password: "secret123"
      })
    ).rejects.toMatchObject({
      code: "INVALID_ARGUMENT",
      message: "Name is required"
    });

    expect(repository.findByEmail).not.toHaveBeenCalled();
    expect(repository.createStudent).not.toHaveBeenCalled();
  });

  test("throws ALREADY_EXISTS when registering with an existing email", async () => {
    repository.findByEmail.mockResolvedValue({ id: "student-1" });

    await expect(
      service.createStudent({
        name: "Nguyen Van A",
        email: "student@example.com",
        password: "secret123"
      })
    ).rejects.toMatchObject({
      code: "ALREADY_EXISTS",
      message: "Email already exists"
    });

    expect(repository.createStudent).not.toHaveBeenCalled();
  });

  test("creates a student with a hashed password", async () => {
    repository.findByEmail.mockResolvedValue(null);
    repository.createStudent.mockImplementation(async (payload) => ({
      id: "student-1",
      name: payload.name,
      email: payload.email,
      status: "ACTIVE",
      passwordHash: payload.passwordHash
    }));

    const result = await service.createStudent({
      name: " Nguyen Van A ",
      email: "STUDENT@example.com",
      password: "secret123"
    });

    expect(repository.createStudent).toHaveBeenCalledTimes(1);
    const savedStudent = repository.createStudent.mock.calls[0][0];
    expect(savedStudent).toMatchObject({
      name: "Nguyen Van A",
      email: "student@example.com"
    });
    expect(savedStudent.passwordHash).not.toBe("secret123");
    expect(bcrypt.compareSync("secret123", savedStudent.passwordHash)).toBe(true);
    expect(result).toMatchObject({
      id: "student-1",
      name: "Nguyen Van A",
      email: "student@example.com",
      status: "ACTIVE"
    });
  });
});

describe("student-service authenticateStudent", () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = createMockRepository();
    service = createStudentService(repository);
  });

  test("returns success and student info when credentials are valid", async () => {
    repository.findByEmail.mockResolvedValue({
      id: "student-1",
      name: "Nguyen Van A",
      email: "student@example.com",
      password: bcrypt.hashSync("secret123", 4),
      status: "ACTIVE"
    });

    await expect(
      service.authenticateStudent({
        email: "student@example.com",
        password: "secret123"
      })
    ).resolves.toEqual({
      success: true,
      student: {
        id: "student-1",
        name: "Nguyen Van A",
        email: "student@example.com",
        status: "ACTIVE"
      }
    });
  });

  test("returns failure when email does not exist", async () => {
    repository.findByEmail.mockResolvedValue(null);

    await expect(
      service.authenticateStudent({
        email: "missing@example.com",
        password: "secret123"
      })
    ).resolves.toEqual({
      success: false,
      student: null
    });
  });

  test("returns failure when password is invalid", async () => {
    repository.findByEmail.mockResolvedValue({
      id: "student-1",
      name: "Nguyen Van A",
      email: "student@example.com",
      password: bcrypt.hashSync("secret123", 4),
      status: "ACTIVE"
    });

    await expect(
      service.authenticateStudent({
        email: "student@example.com",
        password: "wrong-password"
      })
    ).resolves.toEqual({
      success: false,
      student: null
    });
  });
});
