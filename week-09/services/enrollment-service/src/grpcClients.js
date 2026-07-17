import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import CircuitBreaker from "opossum";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTOS_DIR = path.resolve(__dirname, "../../../protos");

function loadProto(relativePath, packageName, serviceName, address) {
  const protoPath = path.resolve(PROTOS_DIR, relativePath);
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const loaded = grpc.loadPackageDefinition(packageDefinition);

  return new loaded[packageName][serviceName](
    address,
    grpc.credentials.createInsecure()
  );
}

export function callUnary(client, method, request, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const deadline = new Date(Date.now() + timeoutMs);
    const metadata = new grpc.Metadata();

    client[method](request, metadata, { deadline }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

function createGateway(client, method) {
  return new CircuitBreaker(
    (request) => callUnary(client, method, request, 1200),
    {
      timeout: 1500,
      errorThresholdPercentage: 50,
      resetTimeout: 5000,
      errorFilter: (error) => error.code === grpc.status.NOT_FOUND
    }
  );
}

function normalizeBreakerError(error, unavailableMessage) {
  if (typeof error.code === "number") {
    throw error;
  }

  const unavailable = new Error(unavailableMessage);
  unavailable.code = "UNAVAILABLE";
  throw unavailable;
}

async function fireGateway(breaker, request, unavailableMessage) {
  try {
    return await breaker.fire(request);
  } catch (error) {
    if (error.code === grpc.status.NOT_FOUND) {
      return null;
    }

    normalizeBreakerError(error, unavailableMessage);
  }
}

export const studentClient = loadProto(
  "student.proto",
  "student",
  "StudentService",
  process.env.STUDENT_GRPC_URL || "localhost:50051"
);

export const courseClient = loadProto(
  "course.proto",
  "course",
  "CourseService",
  process.env.COURSE_GRPC_URL || "localhost:50052"
);

const studentBreaker = createGateway(
  studentClient,
  "getStudent"
);

const courseBreaker = createGateway(
  courseClient,
  "getCourse"
);

export const studentGateway = {
  async getStudent(id) {
    const response = await fireGateway(
      studentBreaker,
      { id },
      "Student service unavailable"
    );
    if (!response) return null;

    return response.student;
  }
};

export const courseGateway = {
  async getCourse(id) {
    const response = await fireGateway(
      courseBreaker,
      { id },
      "Course service unavailable"
    );
    if (!response) return null;

    return response.course;
  }
};
