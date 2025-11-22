// src/modules/admin/editorInvite.service.ts
import { randomUUID } from "crypto";
import { prisma } from "../../config/database";
import { CreateEditorInviteInput } from "./editor.validation";

export class EditorInviteService {
  async createInvite(data: CreateEditorInviteInput) {
    const { email, role, expiresInDays } = data;

    // Optional: invalidate existing invites for this email
    await prisma.editorInvite.deleteMany({ where: { email, usedAt: null } });

    const token = randomUUID();
    const now = new Date();
    const expiresAt = expiresInDays
      ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const invite = await prisma.editorInvite.create({
      data: {
        email,
        token,
        role,
        expiresAt,
      },
    });

    return invite;
  }

  async listInvites(params: { status?: "pending" | "used" | "expired" }) {
    const { status } = params;
    const now = new Date();

    let where: any = {};
    if (status === "pending") {
      where = {
        usedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      };
    } else if (status === "used") {
      where = { usedAt: { not: null } };
    } else if (status === "expired") {
      where = { usedAt: null, expiresAt: { lte: now } };
    }

    return prisma.editorInvite.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async acceptInvite(params: {
    token: string;
    name: string;
    passwordHash: string;
  }) {
    const { token, name, passwordHash } = params;
    const now = new Date();

    const invite = await prisma.editorInvite.findUnique({ where: { token } });
    if (!invite) {
      throw new Error("Invalid invite token");
    }

    if (invite.usedAt) {
      throw new Error("Invite already used");
    }

    if (invite.expiresAt && invite.expiresAt <= now) {
      throw new Error("Invite expired");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: invite.email,
        password: passwordHash,
        role: invite.role,
      },
    });

    await prisma.editorInvite.update({
      where: { id: invite.id },
      data: {
        usedAt: now,
        usedById: user.id,
      },
    });

    return user;
  }
}

export const editorInviteService = new EditorInviteService();
