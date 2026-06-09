import { getClientCount } from "./sseHub.js";

export function registerHealthRoutes(app) {
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "notification-service",
      sseClients: getClientCount()
    });
  });
}

