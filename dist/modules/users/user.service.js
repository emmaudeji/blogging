"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../../config/database");
const user_validation_1 = require("./user.validation");
const pagination_1 = require("../../utils/pagination");
class UserService {
    async findMany(params) {
        const { skip = 0, take = 20, query } = params;
        const where = query
            ? {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                ],
            }
            : {};
        const [users, total] = await Promise.all([
            database_1.prisma.user.findMany({
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
            database_1.prisma.user.count({ where }),
        ]);
        return { users, total };
    }
    /**
    * Cursor-based user search with name/email filtering.
    */
    async findManyCursor(params) {
        const { cursor, query } = params;
        const limit = (0, pagination_1.normalizeLimit)(params.limit);
        const where = query
            ? {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                ],
            }
            : {};
        const users = await database_1.prisma.user.findMany({
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
        let nextCursor = null;
        if (users.length > limit) {
            const nextUser = users.pop();
            if (nextUser)
                nextCursor = nextUser.id;
        }
        return {
            data: users,
            nextCursor,
        };
    }
    async findById(id) {
        return database_1.prisma.user.findUnique({
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
    async updateProfile(userId, payload) {
        const data = user_validation_1.updateProfileSchema.parse(payload);
        // prevent role change via this method
        delete data.role;
        const user = await database_1.prisma.user.update({
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
    async changePassword(userId, payload) {
        const { oldPassword, newPassword } = user_validation_1.changePasswordSchema.parse(payload);
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error("User not found");
        const ok = await bcrypt_1.default.compare(oldPassword, user.password);
        if (!ok)
            throw new Error("Old password does not match");
        const hash = await bcrypt_1.default.hash(newPassword, 12);
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { password: hash },
        });
        return { message: "Password updated" };
    }
    async adminUpdateUser(targetId, payload) {
        const data = user_validation_1.adminUpdateUserSchema.parse(payload);
        // if email is being updated, ensure uniqueness
        if (data.email) {
            const existing = await database_1.prisma.user.findUnique({
                where: { email: data.email },
            });
            if (existing && existing.id !== targetId) {
                throw new Error("Email already in use");
            }
        }
        // Prevent demoting the last admin
        if (data.role && data.role !== "ADMIN") {
            const target = await database_1.prisma.user.findUnique({ where: { id: targetId } });
            if (target?.role === "ADMIN") {
                const adminCount = await database_1.prisma.user.count({ where: { role: "ADMIN" } });
                if (adminCount === 1) {
                    throw new Error("Cannot demote the last admin");
                }
            }
        }
        const user = await database_1.prisma.user.update({
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
        return user;
    }
    async deleteUser(targetId) {
        // Prevent deleting the last admin
        const target = await database_1.prisma.user.findUnique({ where: { id: targetId } });
        if (target?.role === "ADMIN") {
            const adminCount = await database_1.prisma.user.count({ where: { role: "ADMIN" } });
            if (adminCount === 1) {
                throw new Error("Cannot delete the last admin");
            }
        }
        // consider soft-delete in production; hard delete shown here
        await database_1.prisma.user.delete({ where: { id: targetId } });
        return { message: "User deleted" };
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
