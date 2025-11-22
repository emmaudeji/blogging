// src/types/express.d.ts
import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Extend express-session's SessionData so req.session.userId is typed
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}
