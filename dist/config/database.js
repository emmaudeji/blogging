"use strict";
// src/config/database.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const env_1 = require("./env");
// --------------
// GLOBAL INSTANCE (for dev)
// --------------
const globalForPrisma = global;
// --------------
// CREATE PRISMA CLIENT
// --------------
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: ["query", "error", "warn"], // optional
    });
// Store instance globally ONLY in dev
if (env_1.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
// --------------
// CONNECT
// --------------
const connectDB = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info("Connected to PostgreSQL database");
    }
    catch (err) {
        logger_1.logger.error("Database connection failed", err);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
// --------------
// DISCONNECT
// --------------
const disconnectDB = async () => {
    await exports.prisma.$disconnect();
    logger_1.logger.info("Disconnected from PostgreSQL");
};
exports.disconnectDB = disconnectDB;
