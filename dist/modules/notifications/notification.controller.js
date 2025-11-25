"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
const realtime_1 = require("../../utils/realtime");
class NotificationController {
    async list(req, res) {
        const limit = Number(req.query.limit) || 20;
        const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const notifications = await notification_service_1.notificationService.list(req.user.id, limit, cursor);
        res.json(notifications);
    }
    async markRead(req, res) {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        await notification_service_1.notificationService.markRead(id, req.user.id);
        res.status(204).send();
    }
    async markAllRead(req, res) {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        await notification_service_1.notificationService.markAllRead(req.user.id);
        res.status(204).send();
    }
    /**
     * Server-Sent Events (SSE) stream for real-time notifications.
     * Keeps an open HTTP connection and pushes events as they occur.
     */
    async stream(req, res, _next) {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        realtime_1.realtime.addClient(req.user.id, res);
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
