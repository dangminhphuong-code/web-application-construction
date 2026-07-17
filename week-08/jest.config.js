export default {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  transform: {},
  collectCoverageFrom: [
    "services/**/src/**/*.js",
    "graphql-server/src/**/*.js",
    "!**/server.js",
    "!**/db.js",
    "!**/health.js",
    "!**/outboxWorker.js",
    "!**/rabbitmq*.js",
    "!**/grpcClients.js"
  ]
};
