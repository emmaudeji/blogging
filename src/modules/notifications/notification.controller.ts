import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service";
import { realtime } from "../../utils/realtime";

export class NotificationController {
  async list(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notifications = await notificationService.list(
      req.user.id,
      limit,
      cursor
    );
    res.json(notifications);
  }

  async markRead(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    await notificationService.markRead(id, req.user.id);
    res.status(204).send();
  }

  async markAllRead(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await notificationService.markAllRead(req.user.id);
    res.status(204).send();
  }

  /**
   * Server-Sent Events (SSE) stream for real-time notifications.
   * Keeps an open HTTP connection and pushes events as they occur.
   */
  async stream(req: Request, res: Response, _next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    realtime.addClient(req.user.id, res);
  }
}

export const notificationController = new NotificationController();
