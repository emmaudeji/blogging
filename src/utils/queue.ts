import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { transporter } from "./email";
import { notificationService } from "../modules/notifications/notification.service";

const connection = new IORedis(process.env.REDIS_URL!);

export const notificationQueue = new Queue("notifications", { connection });

// Worker to process jobs
export const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    const { userEmail, subject, message, notificationId } = job.data;

    try {
      await transporter.sendMail({
        from: `"Blog App" <${process.env.SMTP_FROM}>`,
        to: userEmail,
        subject,
        html: `<p>${message}</p>`,
      });

      await notificationService.markSent(notificationId);
    } catch (error) {
      await notificationService.markFailed(notificationId);
      console.error("Notification failed:", error);
    }
  },
  { connection }
);
