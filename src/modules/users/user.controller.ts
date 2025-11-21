// src/modules/users/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";

export class UserController {
    async listCursor(req: Request, res: Response, next: NextFunction) {
    try {
        const { cursor, limit, q } = req.query;

        const result = await userService.findManyCursor({
        cursor: typeof cursor === "string" ? cursor : undefined,
        limit: limit ? Number(limit) : undefined,
        query: typeof q === "string" ? q : undefined,
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
    }


  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const skip = Number(req.query.skip ?? 0);
      const take = Number(req.query.take ?? 20);
      const query = typeof req.query.q === "string" ? req.query.q : undefined;

      const { users, total } = await userService.findMany({ skip, take, query });
      res.json({ total, users });
    } catch (err) {
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const user = await userService.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const fresh = await userService.findById(user.id);
      res.json(fresh);
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const updated = await userService.updateProfile(user.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await userService.changePassword(user.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Admin actions
  async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const updated = await userService.adminUpdateUser(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      await userService.deleteUser(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
