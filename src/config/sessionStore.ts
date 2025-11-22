// src/config/sessionStore.ts
import session from "express-session";
import pgSession from "connect-pg-simple";
import { env } from "./env";

const PgSession = pgSession(session);

export const sessionOptions = {
  store: new PgSession({
    conString: env.DATABASE_URL,
    createTableIfMissing: true,
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
