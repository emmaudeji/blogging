"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionOptions = void 0;
// src/config/sessionStore.ts
const express_session_1 = __importDefault(require("express-session"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const env_1 = require("./env");
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
exports.sessionOptions = {
    store: new PgSession({
        conString: env_1.env.DATABASE_URL,
        createTableIfMissing: true,
        schemaName: "session", // keep session table out of Prisma-managed public schema
        tableName: "session",
    }),
    secret: env_1.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: env_1.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
};
