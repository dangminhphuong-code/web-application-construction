import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";

import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import { grpcClients } from "./grpcClients.js";
import { createLoaders } from "./loaders.js";
import { getCurrentStudentId } from "./auth.js";

const PORT = Number(process.env.PORT || 4000);

const app = express();
const httpServer = http.createServer(app);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "graphql-server"
  });
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
});

await server.start();

app.use(
  "/graphql",
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
      return {
        grpc: grpcClients,
        currentStudentId: getCurrentStudentId(req.headers.authorization || null),
        loaders: createLoaders(grpcClients)
      };
    }
  })
);

await new Promise((resolve) => {
  httpServer.listen(PORT, resolve);
});

console.log(`GraphQL Server listening on http://localhost:${PORT}/graphql`);
