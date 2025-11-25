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
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
// Queues are optional in development; enable with ENABLE_QUEUES=true and a valid REDIS_URL
const enableQueues = env_1.env.ENABLE_QUEUES === "true" && !!env_1.env.REDIS_URL;
let notificationQueue;
let notificationWorker = null;
exports.notificationWorker = notificationWorker;
if (enableQueues) {
    // BullMQ requires maxRetriesPerRequest = null with ioredis v5+
    const connection = new ioredis_1.default(env_1.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
    exports.notificationQueue = notificationQueue = new bullmq_1.Queue("notifications", { connection });
    // Worker to process jobs
    exports.notificationWorker = notificationWorker = new bullmq_1.Worker("notifications", async (job) => {
        const { userEmail, subject, message, notificationId } = job.data;
        try {
            await email_1.transporter.sendMail({
                from: env_1.env.SMTP_FROM,
                to: userEmail,
                subject,
                html: `<p>${message}</p>`,
            });
            await notification_service_1.notificationService.markSent(notificationId);
        }
        catch (error) {
            await notification_service_1.notificationService.markFailed(notificationId);
            logger_1.logger.error("Notification failed", { error });
        }
    }, { connection });
}
else {
    // No-op queue used when Redis/queues are disabled, so server can start without Redis
    exports.notificationQueue = notificationQueue = {
        async add(name, data) {
            if (env_1.env.NODE_ENV === "development") {
                // Intentionally minimal logging to avoid noise in production templates
                logger_1.logger.debug(`[queue disabled] Skipping job`, { name });
            }
        },
    };
}
