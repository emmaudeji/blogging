import helmet from "helmet";
import xss from "xss-clean";
import hpp from "hpp";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

/** Global rate limiter for all routes */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

/** Apply security middlewares */
export function applySecurity(app: any) {
  // Set HTTP headers
  app.use(helmet());

  // Prevent XSS attacks
  app.use(xss());

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // Enable CORS
  app.use(cors({
    origin: env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  }));

  // Global rate limiter
  app.use(globalRateLimiter);
}

/** Example: per-route stricter rate limit for auth endpoints */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 login attempts per IP
  message: "Too many login attempts. Please try again later.",
});
