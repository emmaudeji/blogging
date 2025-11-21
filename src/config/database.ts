// src/config/database.ts
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

export const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info("Connected to PostgreSQL database");
  } catch (err) {
    logger.error("Database connection failed", err);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDB = async () => {
  await prisma.$disconnect();
  logger.info("Disconnected from PostgreSQL");
};
