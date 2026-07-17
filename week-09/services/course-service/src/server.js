import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { db } from "./db.js";
import { closeRedis } from "./courseCache.js";
import { startHealthServer } from "./health.js";
import { createCourseRepository } from "./courseRepository.js";
import { createCourseService } from "./courseService.js";
import { createCourseGrpcHandlers } from "./courseGrpcHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, "../../../protos/course.proto");
const INSTANCE_NAME = process.env.INSTANCE_NAME || "course-service";

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

let shuttingDown = false;

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

    console.log(`[${INSTANCE_NAME}] gRPC listening on ${grpcAddress}`);
    grpcServer.start();
  }
);

startHealthServer({
  serviceName: INSTANCE_NAME,
  port: healthPort,
  db
});

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`[${INSTANCE_NAME}] received ${signal}`);
  grpcServer.tryShutdown(async (error) => {
    if (error) {
      console.error(`[${INSTANCE_NAME}] gRPC shutdown error:`, error);
      grpcServer.forceShutdown();
    }

    await Promise.allSettled([closeRedis(), db.destroy()]);
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));