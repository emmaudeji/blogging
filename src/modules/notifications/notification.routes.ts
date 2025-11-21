import { Router } from "express";
import { notificationController } from "./notification.controller";
import { authGuard } from "../../middleware/authGuard";

const router = Router();

// Authenticated users can list their notifications
router.get("/", authGuard, notificationController.list);

export default router;
