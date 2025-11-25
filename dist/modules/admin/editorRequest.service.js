"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editorRequestService = exports.EditorRequestService = void 0;
// src/modules/admin/editorRequest.service.ts
const database_1 = require("../../config/database");
const notification_service_1 = require("../notifications/notification.service");
const notification_types_1 = require("../notifications/notification.types");
class EditorRequestService {
    async createRequest(userId, data) {
        // If there is already a pending request, just return it
        const existing = await database_1.prisma.editorRequest.findFirst({
            where: { userId, status: "PENDING" },
        });
        if (existing)
            return existing;
        const request = await database_1.prisma.editorRequest.create({
            data: {
                userId,
                note: data.note,
            },
        });
        // Notify admins that a new editor request has been submitted
        const admins = await database_1.prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
        });
        await Promise.all(admins.map((admin) => notification_service_1.notificationService.create(admin.id, notification_types_1.NotificationTypes.EDITOR_REQUEST_SUBMITTED, "New editor request", "A reader has requested editor access.", { requestId: request.id, userId })));
        return request;
    }
    async listRequests(status) {
        return database_1.prisma.editorRequest.findMany({
            where: status ? { status } : {},
            orderBy: { createdAt: "desc" },
        });
    }
    async decideRequest(id, decidedById, data) {
        const request = await database_1.prisma.editorRequest.findUnique({ where: { id } });
        if (!request)
            throw new Error("Request not found");
        if (request.status !== "PENDING") {
            throw new Error("Request already decided");
        }
        const now = new Date();
        const updated = await database_1.prisma.$transaction(async (tx) => {
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
        await notification_service_1.notificationService.create(request.userId, data.status === "APPROVED"
            ? notification_types_1.NotificationTypes.EDITOR_REQUEST_APPROVED
            : notification_types_1.NotificationTypes.EDITOR_REQUEST_REJECTED, data.status === "APPROVED"
            ? "Editor request approved"
            : "Editor request rejected", data.status === "APPROVED"
            ? "Your request to become an editor has been approved."
            : "Your request to become an editor has been rejected.", { requestId: request.id, status: data.status, note: data.note });
        return updated;
    }
}
exports.EditorRequestService = EditorRequestService;
exports.editorRequestService = new EditorRequestService();
