import { Request, Response } from "express";
import { adminService } from "./admin.service";

export class AdminController {
  async stats(req: Request, res: Response) {
    const [posts, comments, users, media] = await Promise.all([
      adminService.getPostsStats(),
      adminService.getCommentsStats(),
      adminService.getUsersStats(),
      adminService.getMediaStats(),
    ]);

    res.json({ posts, comments, users, media });
  }

  async recentActivity(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 10;
    const activity = await adminService.getRecentActivity(limit);
    res.json(activity);
  }
}

export const adminController = new AdminController();
