// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import session from "express-session";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
// These modules ship without TypeScript types; import as any-typed functions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const xss = require("xss-clean") as unknown as () => express.RequestHandler;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hpp = require("hpp") as unknown as () => express.RequestHandler;
import path from "path";
import type { Request, Response, NextFunction } from "express";

import { sessionOptions } from "./config/sessionStore";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";

// Routes
import router from "./routes";

export const app = express();

// Trust proxy (needed for HTTPS on platforms like Render/Fly)
app.set("trust proxy", 1);

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.NODE_ENV === "development") app.use(morgan("dev"));

// Sessions
app.use(session(sessionOptions));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts, try again later",
});
app.use("/api/auth", authLimiter);

// ---------------------------
// ⭐ ROOT BASE ROUTE - serve DOCUMENT.md
// ---------------------------
app.get("/", (req, res) => {
  const docPath = path.resolve(process.cwd(), "DOCUMENT.md");

  res.sendFile(docPath, {}, (err) => {
    if (err) {
      return res.status(500).send("DOCUMENT.md not found");
    }
  });
});

// Mount API routes
app.use("/api", router);

// Handle JSON parse errors from body-parser explicitly
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && (err as any).type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }
  next(err);
});

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

// Global error handler (must be last)
app.use(errorHandler);
