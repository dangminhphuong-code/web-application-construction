import "dotenv/config";
import cors from "cors";
import express from "express";

import { authenticateSseRequest } from "./authMiddleware.js";
import { registerHealthRoutes } from "./health.js";
import {
  closeNotificationConsumer,
  startNotificationConsumer
} from "./rabbitmqConsumer.js";
import { addClient, startHeartbeat } from "./sseHub.js";

const PORT = Number(process.env.PORT || 3004);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true
  })
);

registerHealthRoutes(app);

app.get("/events", authenticateSseRequest, (req, res) => {
  addClient({ req, res });
});

let heartbeatTimer = null;
let server = null;

async function shutdown() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }

  await closeNotificationConsumer();

  if (server) {
    server.close(() => process.exit(0));
    return;
  }

  process.exit(0);
}

async function main() {
  await startNotificationConsumer();

  server = app.listen(PORT, () => {
    heartbeatTimer = startHeartbeat();
    console.log(`[notification-service] HTTP/SSE listening on port ${PORT}`);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((error) => {
  console.error("[notification-service] fatal error:", error);
  process.exit(1);
});
