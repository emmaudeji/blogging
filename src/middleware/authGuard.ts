// src/middleware/authGuard.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";

export async function authGuard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user; // typed via declaration merge
    next();
  } catch (err) {
    next(err);
  }
}
