import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import CircuitBreaker from "opossum";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTOS_DIR = path.resolve(__dirname, "../../protos");
const DEFAULT_TIMEOUT_MS = Number(process.env.GRPC_TIMEOUT_MS || 1500);
const ENROLLMENT_TIMEOUT_MS = Number(
  process.env.GRPC_ENROLLMENT_TIMEOUT_MS || 2500
);

function loadProto(relativeProtoPath, packageName) {
  const protoPath = path.resolve(PROTOS_DIR, relativeProtoPath);
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  return grpc.loadPackageDefinition(packageDefinition)[packageName];
}

function callUnaryWithDeadline(client, methodName, request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const clientMethod = client[methodName];
    if (!clientMethod) {
      reject(new Error(`Unknown gRPC method: ${methodName}`));
      return;
    }

    const metadata = new grpc.Metadata();
    const options = {
      deadline: new Date(Date.now() + timeoutMs)
    };

    clientMethod.call(client, request, metadata, options, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

function createCircuitBreakerCaller(client, { timeoutMs }) {
  const breakers = new Map();
  const businessErrorCodes = new Set([
    grpc.status.NOT_FOUND,
    grpc.status.INVALID_ARGUMENT,
    grpc.status.ALREADY_EXISTS,
    grpc.status.FAILED_PRECONDITION,
    grpc.status.UNAUTHENTICATED,
    grpc.status.PERMISSION_DENIED
  ]);

  return function call(methodName, request = {}, overrideOptions = {}) {
    const effectiveTimeoutMs = overrideOptions.timeoutMs || timeoutMs;
    const breakerKey = `${methodName}:${effectiveTimeoutMs}`;

    if (!breakers.has(breakerKey)) {
      const breaker = new CircuitBreaker(
        (payload) =>
          callUnaryWithDeadline(client, methodName, payload, effectiveTimeoutMs),
        {
          timeout: effectiveTimeoutMs + 300,
          errorThresholdPercentage: 50,
          resetTimeout: 5000,
          errorFilter: (error) => businessErrorCodes.has(error.code)
        }
      );

      breakers.set(breakerKey, breaker);
    }

    return breakers
      .get(breakerKey)
      .fire(request)
      .catch((error) => {
        if (typeof error.code === "number") {
          throw error;
        }

        const unavailable = new Error(`${methodName} service call unavailable`);
        unavailable.code = grpc.status.UNAVAILABLE;
        unavailable.details = `${methodName} service call unavailable`;
        throw unavailable;
      });
  };
}

const studentProto = loadProto("student.proto", "student");
const courseProto = loadProto("course.proto", "course");
const enrollmentProto = loadProto("enrollment.proto", "enrollment");

const studentClient = new studentProto.StudentService(
  process.env.STUDENT_SERVICE_ADDR || "localhost:50051",
  grpc.credentials.createInsecure()
);

const courseClient = new courseProto.CourseService(
  process.env.COURSE_SERVICE_ADDR || "localhost:50052",
  grpc.credentials.createInsecure()
);

const enrollmentClient = new enrollmentProto.EnrollmentService(
  process.env.ENROLLMENT_SERVICE_ADDR || "localhost:50053",
  grpc.credentials.createInsecure()
);

export const grpcClients = {
  student: {
    raw: studentClient,
    call: createCircuitBreakerCaller(studentClient, {
      timeoutMs: DEFAULT_TIMEOUT_MS
    })
  },
  course: {
    raw: courseClient,
    call: createCircuitBreakerCaller(courseClient, {
      timeoutMs: DEFAULT_TIMEOUT_MS
    })
  },
  enrollment: {
    raw: enrollmentClient,
    call: createCircuitBreakerCaller(enrollmentClient, {
      timeoutMs: ENROLLMENT_TIMEOUT_MS
    })
  }
};

export { grpc };
