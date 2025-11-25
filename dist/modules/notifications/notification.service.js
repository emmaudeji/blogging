"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const database_1 = require("../../config/database");
const queue_1 = require("../../utils/queue");
const realtime_1 = require("../../utils/realtime");
class NotificationService {
    async create(userId, type, subject, message, data) {
        const notification = await database_1.prisma.notification.create({
            data: { userId, type, subject, message, data },
        });
        // Push real-time event to any connected clients for this user
        realtime_1.realtime.pushNotification(notification);
        // enqueue async email
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await queue_1.notificationQueue.add("send-email", {
                userEmail: user.email,
                subject,
                message,
                notificationId: notification.id,
            });
        }
        return notification;
    }
    async markSent(id) {
        return database_1.prisma.notification.update({
            where: { id },
            data: { status: "SENT", sentAt: new Date() },
        });
    }
    async markFailed(id) {
        return database_1.prisma.notification.update({
            where: { id },
            data: { status: "FAILED" },
        });
    }
    async list(userId, limit = 20, cursor) {
        const notifications = await database_1.prisma.notification.findMany({
            where: { userId },
            take: limit + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" },
        });
        let nextCursor = null;
        if (notifications.length > limit) {
            const next = notifications.pop();
            nextCursor = next ? next.id : null;
        }
        return {
            data: notifications,
            nextCursor,
        };
    }
}
exports.notificationService = new NotificationService();
// 9. Production Best Practices
// Queue for async processing (BullMQ + Redis)
// Retry failed emails
// Use NotificationStatus to track delivery
// Do not block request → email is async
// Rate-limit notification-triggering endpoints
// Template emails (HTML) stored externally for maintainability
// Logs for failures → integrate with Winston or external logging service
