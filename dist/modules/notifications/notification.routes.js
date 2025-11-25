"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const authGuard_1 = require("../../middleware/authGuard");
const router = (0, express_1.Router)();
// Authenticated users can list their notifications
router.get("/", authGuard_1.authGuard, notification_controller_1.notificationController.list);
// Mark a single notification as read
router.patch("/:id/read", authGuard_1.authGuard, (req, res) => notification_controller_1.notificationController.markRead(req, res));
// Mark all notifications for the current user as read
router.post("/read-all", authGuard_1.authGuard, (req, res) => notification_controller_1.notificationController.markAllRead(req, res));
// Real-time notifications stream via Server-Sent Events (SSE)
router.get("/stream", authGuard_1.authGuard, (req, res, next) => notification_controller_1.notificationController.stream(req, res, next));
exports.default = router;
