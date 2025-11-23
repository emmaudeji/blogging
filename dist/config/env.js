"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// src/config/env.ts
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]),
    PORT: zod_1.z.string().default("4000"),
    DATABASE_URL: zod_1.z.string().url(),
    FRONTEND_URL: zod_1.z.string().url(),
    SESSION_SECRET: zod_1.z.string().min(32),
    // cloudinary
    CLOUDINARY_CLOUD_NAME: zod_1.z.string(),
    CLOUDINARY_API_KEY: zod_1.z.string(),
    CLOUDINARY_API_SECRET: zod_1.z.string(),
    // email services
    SMTP_HOST: zod_1.z.string(),
    SMTP_PORT: zod_1.z.string(),
    SMTP_USER: zod_1.z.string(),
    SMTP_PASS: zod_1.z.string(),
    SMTP_FROM: zod_1.z.string(),
});
exports.env = envSchema.parse(process.env);
