"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editorRequestService = exports.EditorRequestService = void 0;
// src/modules/admin/editorRequest.service.ts
const database_1 = require("../../config/database");
class EditorRequestService {
    async createRequest(userId, data) {
        // If there is already a pending request, just return it
        const existing = await database_1.prisma.editorRequest.findFirst({
            where: { userId, status: "PENDING" },
        });
        if (existing)
            return existing;
        return database_1.prisma.editorRequest.create({
            data: {
                userId,
                note: data.note,
            },
        });
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
        return updated;
    }
}
exports.EditorRequestService = EditorRequestService;
exports.editorRequestService = new EditorRequestService();
