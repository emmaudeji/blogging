// src/config/database.ts

import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";
import { env } from "./env";

// --------------
// GLOBAL INSTANCE (for dev)
// --------------
const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

// --------------
// CREATE PRISMA CLIENT
// --------------
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"], // optional
  });

// Store instance globally ONLY in dev
if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// --------------
// CONNECT
// --------------
export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info("Connected to PostgreSQL database");
  } catch (err) {
    logger.error("Database connection failed", err);
    process.exit(1);
  }
};

// --------------
// DISCONNECT
// --------------
export const disconnectDB = async () => {
  await prisma.$disconnect();
  logger.info("Disconnected from PostgreSQL");
};
