import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTOS_DIR = path.resolve(__dirname, "../../protos");
const DEFAULT_TIMEOUT_MS = Number(process.env.GRPC_TIMEOUT_MS || 5000);

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

function createUnaryCaller(client) {
  return function call(methodName, request = {}) {
    return new Promise((resolve, reject) => {
      const clientMethod = client[methodName];
      if (!clientMethod) {
        reject(new Error(`Unknown gRPC method: ${methodName}`));
        return;
      }

      const metadata = new grpc.Metadata();
      const options = {
        deadline: new Date(Date.now() + DEFAULT_TIMEOUT_MS)
      };

      clientMethod.call(client, request, metadata, options, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      });
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
    call: createUnaryCaller(studentClient)
  },
  course: {
    raw: courseClient,
    call: createUnaryCaller(courseClient)
  },
  enrollment: {
    raw: enrollmentClient,
    call: createUnaryCaller(enrollmentClient)
  }
};

export { grpc };
