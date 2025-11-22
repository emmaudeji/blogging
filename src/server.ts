// src/server.ts
import { app } from "./app";
import { env } from "./config/env";
import { connectDB, disconnectDB } from "./config/database";
import { logger } from "./config/logger";

const startServer = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down server...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer();
