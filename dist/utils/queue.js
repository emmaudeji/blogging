"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationWorker = exports.notificationQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const email_1 = require("./email");
const notification_service_1 = require("../modules/notifications/notification.service");
// Queues are optional in development; enable with ENABLE_QUEUES=true and a valid REDIS_URL
const enableQueues = process.env.ENABLE_QUEUES === "true" && !!process.env.REDIS_URL;
let notificationQueue;
let notificationWorker = null;
exports.notificationWorker = notificationWorker;
if (enableQueues) {
    // BullMQ requires maxRetriesPerRequest = null with ioredis v5+
    const connection = new ioredis_1.default(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
    exports.notificationQueue = notificationQueue = new bullmq_1.Queue("notifications", { connection });
    // Worker to process jobs
    exports.notificationWorker = notificationWorker = new bullmq_1.Worker("notifications", async (job) => {
        const { userEmail, subject, message, notificationId } = job.data;
        try {
            await email_1.transporter.sendMail({
                from: `"Blog App" <${process.env.SMTP_FROM}>`,
                to: userEmail,
                subject,
                html: `<p>${message}</p>`,
            });
            await notification_service_1.notificationService.markSent(notificationId);
        }
        catch (error) {
            await notification_service_1.notificationService.markFailed(notificationId);
            console.error("Notification failed:", error);
        }
    }, { connection });
}
else {
    // No-op queue used when Redis/queues are disabled, so server can start without Redis
    exports.notificationQueue = notificationQueue = {
        async add(name, data) {
            if (process.env.NODE_ENV === "development") {
                // Intentionally minimal logging to avoid noise in production templates
                console.log(`[queue disabled] Skipping job`, name);
            }
        },
    };
}
