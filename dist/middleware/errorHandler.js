"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, req, res, next) {
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: "Validation failed",
            errors: err.flatten(),
        });
    }
    // Custom application errors
    if (err instanceof errors_1.AppError) {
        if (err.statusCode >= 500) {
            logger_1.logger.error(err.message, { stack: err.stack });
        }
        return res.status(err.statusCode).json({ message: err.message });
    }
    // Fallback for unknown errors
    logger_1.logger.error("Unhandled error", err);
    const anyErr = err;
    if (env_1.env.NODE_ENV === "development") {
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
