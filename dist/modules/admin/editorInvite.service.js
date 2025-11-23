"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editorInviteService = exports.EditorInviteService = void 0;
// src/modules/admin/editorInvite.service.ts
const crypto_1 = require("crypto");
const database_1 = require("../../config/database");
class EditorInviteService {
    async createInvite(data) {
        const { email, role, expiresInDays } = data;
        // Optional: invalidate existing invites for this email
        await database_1.prisma.editorInvite.deleteMany({ where: { email, usedAt: null } });
        const token = (0, crypto_1.randomUUID)();
        const now = new Date();
        const expiresAt = expiresInDays
            ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
            : null;
        const invite = await database_1.prisma.editorInvite.create({
            data: {
                email,
                token,
                role,
                expiresAt,
            },
        });
        return invite;
    }
    async listInvites(params) {
        const { status } = params;
        const now = new Date();
        let where = {};
        if (status === "pending") {
            where = {
                usedAt: null,
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            };
        }
        else if (status === "used") {
            where = { usedAt: { not: null } };
        }
        else if (status === "expired") {
            where = { usedAt: null, expiresAt: { lte: now } };
        }
        return database_1.prisma.editorInvite.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
    }
    async acceptInvite(params) {
        const { token, name, passwordHash } = params;
        const now = new Date();
        const invite = await database_1.prisma.editorInvite.findUnique({ where: { token } });
        if (!invite) {
            throw new Error("Invalid invite token");
        }
        if (invite.usedAt) {
            throw new Error("Invite already used");
        }
        if (invite.expiresAt && invite.expiresAt <= now) {
            throw new Error("Invite expired");
        }
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email: invite.email },
        });
        if (existingUser) {
            throw new Error("User with this email already exists");
        }
        const user = await database_1.prisma.user.create({
            data: {
                name,
                email: invite.email,
                password: passwordHash,
                role: invite.role,
            },
        });
        await database_1.prisma.editorInvite.update({
            where: { id: invite.id },
            data: {
                usedAt: now,
                usedById: user.id,
            },
        });
        return user;
    }
}
exports.EditorInviteService = EditorInviteService;
exports.editorInviteService = new EditorInviteService();
