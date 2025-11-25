"use strict";
// src/utils/realtime.ts
// Minimal in-memory pub/sub for real-time notifications using Server-Sent Events (SSE).
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtime = void 0;
class RealtimeManager {
    constructor() {
        this.clientsByUser = new Map();
    }
    addClient(userId, res) {
        // Set SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        // Immediately flush a comment so proxies keep the connection open
        res.write(": connected\n\n");
        let set = this.clientsByUser.get(userId);
        if (!set) {
            set = new Set();
            this.clientsByUser.set(userId, set);
        }
        set.add(res);
        const cleanup = () => {
            const clients = this.clientsByUser.get(userId);
            if (!clients)
                return;
            clients.delete(res);
            if (clients.size === 0) {
                this.clientsByUser.delete(userId);
            }
        };
        // Clean up on disconnect
        res.on("close", cleanup);
        res.on("error", cleanup);
    }
    pushNotification(notification) {
        const { userId } = notification;
        const clients = this.clientsByUser.get(userId);
        if (!clients || clients.size === 0)
            return;
        const payload = JSON.stringify({
            type: notification.type,
            subject: notification.subject,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt,
            status: notification.status,
            id: notification.id,
        });
        for (const res of clients) {
            // SSE format: `event:` (optional), `data:` lines, then blank line
            res.write(`event: notification\n`);
            res.write(`data: ${payload}\n\n`);
        }
    }
}
exports.realtime = new RealtimeManager();
