// src/modules/admin/editorRequest.service.ts
import { prisma } from "../../config/database";
import {
  CreateEditorRequestInput,
  DecideEditorRequestInput,
} from "./editor.validation";

export class EditorRequestService {
  async createRequest(userId: string, data: CreateEditorRequestInput) {
    // If there is already a pending request, just return it
    const existing = await prisma.editorRequest.findFirst({
      where: { userId, status: "PENDING" },
    });

    if (existing) return existing;

    return prisma.editorRequest.create({
      data: {
        userId,
        note: data.note,
      },
    });
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

    return updated;
  }
}

export const editorRequestService = new EditorRequestService();
