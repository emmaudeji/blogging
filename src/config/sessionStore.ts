// src/config/sessionStore.ts
import session, { SessionOptions } from "express-session";
import pgSession from "connect-pg-simple";
import { env } from "./env";

const PgSession = pgSession(session);

export const sessionOptions: SessionOptions = {
  store: new PgSession({
    conString: env.DATABASE_URL,
    createTableIfMissing: true,
    schemaName: "session", // keep session table out of Prisma-managed public schema
    tableName: "session",
  }),

  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  cookie: {
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};
