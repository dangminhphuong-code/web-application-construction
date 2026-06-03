import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { db } from "./db.js";
import { startHealthServer } from "./health.js";
import { createCourseRepository } from "./courseRepository.js";
import { createCourseService } from "./courseService.js";
import { createCourseGrpcHandlers } from "./courseGrpcHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, "../../../protos/course.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const courseProto = grpc.loadPackageDefinition(packageDefinition).course;
const repository = createCourseRepository(db);
const service = createCourseService(repository);
const handlers = createCourseGrpcHandlers(service);
const grpcServer = new grpc.Server();

grpcServer.addService(courseProto.CourseService.service, handlers);

const grpcAddress = process.env.GRPC_ADDRESS || "0.0.0.0:50052";
const healthPort = Number(process.env.HEALTH_PORT || 3002);

grpcServer.bindAsync(
  grpcAddress,
  grpc.ServerCredentials.createInsecure(),
  (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    console.log(`course-service gRPC listening on ${grpcAddress}`);
    grpcServer.start();
  }
);

startHealthServer({
  serviceName: "course-service",
  port: healthPort,
  db
});

process.on("SIGTERM", () => {
  console.log("course-service received SIGTERM");
  grpcServer.tryShutdown(async () => {
    await db.destroy();
    process.exit(0);
  });
});
