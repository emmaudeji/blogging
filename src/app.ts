// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import session from "express-session";
import morgan from "morgan";

import { sessionOptions } from "./config/sessionStore";
import { env } from "./config/env";

// Routes
import router from "./routes";

export const app = express();

// Trust proxy (needed for HTTPS on platforms like Render/Fly)
app.set("trust proxy", 1);

// Security middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
// OR USE applySecurity(app)

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV === "development") app.use(morgan("dev"));

// Sessions
app.use(session(sessionOptions));

// Sanitization
app.use(mongoSanitize());
app.use(xss());

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts, try again later",
});
app.use("/api/auth", authLimiter);

// TODO: set route rate - limits if necessary. 
// app.use(
//   "/api/comments",
//   rateLimit({
//     windowMs: 30 * 1000, // 30 seconds
//     max: 5,
//     standardHeaders: true,
//   })
// );

// Mount routes
app.use("/api", router);

// Global error handler (to be added later)
