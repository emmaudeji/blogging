// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../config/logger";
import { env } from "../config/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.flatten(),
    });
  }

  // Custom application errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { stack: err.stack });
    }
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Fallback for unknown errors
  logger.error("Unhandled error", err as any);

  const anyErr = err as any;

  if (env.NODE_ENV === "development") {
    return res.status(500).json({
      message: "Internal server error",
      error: anyErr?.message,
      stack: anyErr?.stack,
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
}
