const [
  healthPort = "3002",
  grpcPort = "50052",
  instanceName = `course-service-${grpcPort}`
] = process.argv.slice(2);

process.env.HEALTH_PORT = healthPort;
process.env.GRPC_ADDRESS = `0.0.0.0:${grpcPort}`;
process.env.INSTANCE_NAME = instanceName;

await import("../services/course-service/src/server.js");