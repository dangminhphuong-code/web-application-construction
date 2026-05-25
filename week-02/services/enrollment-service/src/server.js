import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

import { db } from "./db.js";
import { startHealthServer } from "./health.js";
import { createEnrollmentRepository } from "./enrollmentRepository.js";
import { createEnrollmentService } from "./enrollmentService.js";
import { createEnrollmentGrpcHandlers } from "./enrollmentGrpcHandlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.resolve(__dirname, "../../../protos/enrollment.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const enrollmentProto = grpc.loadPackageDefinition(packageDefinition).enrollment;
const repository = createEnrollmentRepository(db);
const service = createEnrollmentService(repository);
const handlers = createEnrollmentGrpcHandlers(service);

const grpcServer = new grpc.Server();
grpcServer.addService(enrollmentProto.EnrollmentService.service, handlers);

const grpcAddress = process.env.GRPC_ADDRESS || "0.0.0.0:50053";
const healthPort = Number(process.env.HEALTH_PORT || 3003);

grpcServer.bindAsync(
  grpcAddress,
  grpc.ServerCredentials.createInsecure(),
  (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    grpcServer.start();
    console.log(`enrollment-service gRPC listening on ${grpcAddress}`);
  }
);

const healthServer = startHealthServer({
  serviceName: "enrollment-service",
  port: healthPort,
  db
});

process.on("SIGTERM", async () => {
  console.log("enrollment-service received SIGTERM");
  grpcServer.tryShutdown(async () => {
    healthServer.close();
    await db.destroy();
    console.log("enrollment-service closed");
    process.exit(0);
  });
});
