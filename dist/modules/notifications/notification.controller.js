"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
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
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
