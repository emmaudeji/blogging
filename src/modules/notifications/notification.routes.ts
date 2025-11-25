import { Router } from "express";
import { notificationController } from "./notification.controller";
import { authGuard } from "../../middleware/authGuard";

const router = Router();

// Authenticated users can list their notifications
router.get("/", authGuard, notificationController.list);

// Mark a single notification as read
router.patch("/:id/read", authGuard, (req, res) =>
  notificationController.markRead(req, res)
);

// Mark all notifications for the current user as read
router.post("/read-all", authGuard, (req, res) =>
  notificationController.markAllRead(req, res)
);

// Real-time notifications stream via Server-Sent Events (SSE)
router.get("/stream", authGuard, (req, res, next) =>
  notificationController.stream(req, res, next as any)
);

export default router;
