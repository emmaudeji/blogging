"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = require("./config/logger");
const startServer = async () => {
    await (0, database_1.connectDB)();
    const server = app_1.app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server running on port ${env_1.env.PORT}`);
    });
    // Graceful shutdown
    const shutdown = async () => {
        logger_1.logger.info("Shutting down server...");
        server.close(async () => {
            await (0, database_1.disconnectDB)();
            process.exit(0);
        });
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
};
startServer();
