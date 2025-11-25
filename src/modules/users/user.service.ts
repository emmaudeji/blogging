// src/modules/users/user.service.ts
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../../config/database";
import { notificationService } from "../notifications/notification.service";
import { NotificationTypes } from "../notifications/notification.types";
import {
  adminUpdateUserSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./user.validation";
import { CursorPageResponse, normalizeLimit } from "../../utils/pagination";

export class UserService {
 
async findMany(params: {
    skip?: number;
    take?: number;
    query?: string;
  }): Promise<{ users: any[]; total: number }> {
    const { skip = 0, take = 20, query } = params;
    const where: Prisma.UserWhereInput = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          bio: true,
          avatarUrl: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

   /**
   * Cursor-based user search with name/email filtering.
   */
  async findManyCursor(params: {
    cursor?: string;
    limit?: number;
    query?: string;
  }): Promise<CursorPageResponse<any>> {
    const { cursor, query } = params;
    const limit = normalizeLimit(params.limit);

    const where: Prisma.UserWhereInput = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      take: limit + 1, // fetch one extra to know if nextCursor exists
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    let nextCursor: string | null = null;

    if (users.length > limit) {
      const nextUser = users.pop();
      if (nextUser) nextCursor = nextUser.id;
    }

    return {
      data: users,
      nextCursor,
    };
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        bio: true,
        avatarUrl: true,
      },
    });
  }

  async updateProfile(userId: string, payload: Partial<unknown>) {
    const data = updateProfileSchema.parse(payload);
    // prevent role change via this method
    delete (data as any).role;
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, payload: unknown) {
    const { oldPassword, newPassword } = changePasswordSchema.parse(payload);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) throw new Error("Old password does not match");

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });

    // Notify admins that a password was changed (basic audit trail)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        notificationService.create(
          admin.id,
          NotificationTypes.ADMIN_PASSWORD_CHANGED,
          "Password changed",
          `User ${user.email} has changed their password.`,
          { userId: user.id, email: user.email }
        )
      )
    );

    return { message: "Password updated" };
  }

  async adminUpdateUser(targetId: string, payload: unknown) {
    const data = adminUpdateUserSchema.parse(payload);

    // if email is being updated, ensure uniqueness
    if (data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing && existing.id !== targetId) {
        throw new Error("Email already in use");
      }
    }

    // Prevent demoting the last admin
    if (data.role && data.role !== "ADMIN") {
      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (target?.role === "ADMIN") {
        const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
        if (adminCount === 1) {
          throw new Error("Cannot demote the last admin");
        }
      }
    }

    const previous = await prisma.user.findUnique({ where: { id: targetId } });

    const user = await prisma.user.update({
      where: { id: targetId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Notify the user if their role changed
    if (previous && data.role && data.role !== previous.role) {
      await notificationService.create(
        user.id,
        NotificationTypes.USER_ROLE_CHANGED,
        "Account role updated",
        `Your role has been changed from ${previous.role} to ${data.role}.`,
        { previousRole: previous.role, newRole: data.role }
      );
    }

    return user;
  }

  async deleteUser(targetId: string) {
    // Prevent deleting the last admin
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (target?.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount === 1) {
        throw new Error("Cannot delete the last admin");
      }
    }

    // consider soft-delete in production; hard delete shown here
    const user = await prisma.user.findUnique({ where: { id: targetId } });

    await prisma.user.delete({ where: { id: targetId } });

    if (user) {
      await notificationService.create(
        user.id,
        NotificationTypes.USER_DELETED,
        "Account deleted",
        "Your account has been deleted by an administrator.",
        {}
      );
    }

    return { message: "User deleted" };
  }
}

export const userService = new UserService();
