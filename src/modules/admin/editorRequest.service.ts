// src/modules/admin/editorRequest.service.ts
import { prisma } from "../../config/database";
import {
  CreateEditorRequestInput,
  DecideEditorRequestInput,
} from "./editor.validation";
import { notificationService } from "../notifications/notification.service";
import { NotificationTypes } from "../notifications/notification.types";

export class EditorRequestService {
  async createRequest(userId: string, data: CreateEditorRequestInput) {
    // If there is already a pending request, just return it
    const existing = await prisma.editorRequest.findFirst({
      where: { userId, status: "PENDING" },
    });

    if (existing) return existing;

    const request = await prisma.editorRequest.create({
      data: {
        userId,
        note: data.note,
      },
    });

    // Notify admins that a new editor request has been submitted
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        notificationService.create(
          admin.id,
          NotificationTypes.EDITOR_REQUEST_SUBMITTED,
          "New editor request",
          "A reader has requested editor access.",
          { requestId: request.id, userId }
        )
      )
    );

    return request;
  }

  async listRequests(status?: "PENDING" | "APPROVED" | "REJECTED") {
    return prisma.editorRequest.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  async decideRequest(
    id: string,
    decidedById: string,
    data: DecideEditorRequestInput
  ) {
    const request = await prisma.editorRequest.findUnique({ where: { id } });
    if (!request) throw new Error("Request not found");

    if (request.status !== "PENDING") {
      throw new Error("Request already decided");
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx:any) => {
      const updatedReq = await tx.editorRequest.update({
        where: { id },
        data: {
          status: data.status,
          note: data.note,
          decidedAt: now,
          decidedById,
        },
      });

      if (data.status === "APPROVED") {
        await tx.user.update({
          where: { id: request.userId },
          data: { role: "EDITOR" },
        });
      }

      return updatedReq;
    });

    // Notify the requesting user about the decision
    await notificationService.create(
      request.userId,
      data.status === "APPROVED"
        ? NotificationTypes.EDITOR_REQUEST_APPROVED
        : NotificationTypes.EDITOR_REQUEST_REJECTED,
      data.status === "APPROVED"
        ? "Editor request approved"
        : "Editor request rejected",
      data.status === "APPROVED"
        ? "Your request to become an editor has been approved."
        : "Your request to become an editor has been rejected.",
      { requestId: request.id, status: data.status, note: data.note }
    );

    return updated;
  }
}

export const editorRequestService = new EditorRequestService();
