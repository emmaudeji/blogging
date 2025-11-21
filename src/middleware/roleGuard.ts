// src/middleware/roleGuard.ts
import { Request, Response, NextFunction } from "express";

/**
 * roleGuard returns middleware that ensures the authenticated user
 * has one of the allowed roles. Roles are strings from the Prisma enum:
 * "admin" | "editor" | "reader"
 */
export const roleGuard =
  (allowed: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (!allowed.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
