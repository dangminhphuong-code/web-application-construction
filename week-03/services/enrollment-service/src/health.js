import express from "express";

export function startHealthServer({ serviceName, port, db }) {
  const app = express();

  app.get("/health", async (_req, res) => {
    try {
      await db.raw("select 1");
      res.json({ status: "ok", service: serviceName });
    } catch (error) {
      res.status(503).json({
        status: "error",
        service: serviceName,
        message: error.message
      });
    }
  });

  app.listen(port, () => {
    console.log(`${serviceName} health listening on http://localhost:${port}/health`);
  });
}
