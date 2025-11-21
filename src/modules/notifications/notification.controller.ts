import { Request, Response } from "express";
import { notificationService } from "./notification.service";

export class NotificationController {
  async list(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    const notifications = await notificationService.list(req.user.id, limit, cursor);
    res.json(notifications);
  }
}

export const notificationController = new NotificationController();
