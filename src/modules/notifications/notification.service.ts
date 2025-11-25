import { prisma } from "../../config/database";
import { notificationQueue } from "../../utils/queue";
import { realtime } from "../../utils/realtime";

class NotificationService {
  async create(
    userId: string,
    type: string,
    subject: string,
    message: string,
    data?: object
  ) {
    const notification = await prisma.notification.create({
      data: { userId, type, subject, message, data },
    });

    // Push real-time event to any connected clients for this user
    realtime.pushNotification(notification);

    // enqueue async email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await notificationQueue.add("send-email", {
        userEmail: user.email,
        subject,
        message,
        notificationId: notification.id,
      });
    }

    return notification;
  }

  async markSent(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
  }

  async markFailed(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { status: "FAILED" },
    });
  }

  async list(userId: string, limit = 20, cursor?: string) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (notifications.length > limit) {
      const next = notifications.pop();
      nextCursor = next ? next.id : null;
    }

    return {
      data: notifications,
      nextCursor,
    };
  }

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

export const notificationService = new NotificationService();


// 9. Production Best Practices

// Queue for async processing (BullMQ + Redis)

// Retry failed emails

// Use NotificationStatus to track delivery

// Do not block request → email is async

// Rate-limit notification-triggering endpoints

// Template emails (HTML) stored externally for maintainability

// Logs for failures → integrate with Winston or external logging service