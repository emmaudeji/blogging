import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { transporter } from "./email";
import { notificationService } from "../modules/notifications/notification.service";
import { env } from "../config/env";
import { logger } from "../config/logger";

// Queues are optional in development; enable with ENABLE_QUEUES=true and a valid REDIS_URL
const enableQueues = env.ENABLE_QUEUES === "true" && !!env.REDIS_URL;

let notificationQueue: Queue;
let notificationWorker: Worker | null = null;

if (enableQueues) {
  // BullMQ requires maxRetriesPerRequest = null with ioredis v5+
  const connection = new IORedis(env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  notificationQueue = new Queue("notifications", { connection });

  // Worker to process jobs
  notificationWorker = new Worker(
    "notifications",
    async (job: Job) => {
      const { userEmail, subject, message, notificationId } = job.data;

      try {
        await transporter.sendMail({
          from: env.SMTP_FROM,
          to: userEmail,
          subject,
          html: `<p>${message}</p>`,
        });

        await notificationService.markSent(notificationId);
      } catch (error) {
        await notificationService.markFailed(notificationId);
        logger.error("Notification failed", { error });
      }
    },
    { connection }
  );
} else {
  // No-op queue used when Redis/queues are disabled, so server can start without Redis
  notificationQueue = {
    async add(name: string, data: any) {
      if (env.NODE_ENV === "development") {
        // Intentionally minimal logging to avoid noise in production templates
        logger.debug(`[queue disabled] Skipping job`, { name });
      }
    },
  } as unknown as Queue;
}

export { notificationQueue, notificationWorker };
