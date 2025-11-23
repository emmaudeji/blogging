"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
const database_1 = require("../../config/database");
class AdminService {
    /** Posts metrics */
    async getPostsStats() {
        const total = await database_1.prisma.post.count();
        const draft = await database_1.prisma.post.count({ where: { status: "DRAFT" } });
        const published = await database_1.prisma.post.count({ where: { status: "PUBLISHED" } });
        return { total, draft, published };
    }
    /** Comments metrics */
    async getCommentsStats() {
        const total = await database_1.prisma.comment.count();
        const pending = await database_1.prisma.comment.count({ where: { status: "PENDING" } });
        const approved = await database_1.prisma.comment.count({ where: { status: "APPROVED" } });
        const rejected = await database_1.prisma.comment.count({ where: { status: "REJECTED" } });
        return { total, pending, approved, rejected };
    }
    /** Users metrics */
    async getUsersStats() {
        const total = await database_1.prisma.user.count();
        const admins = await database_1.prisma.user.count({ where: { role: "ADMIN" } });
        const editors = await database_1.prisma.user.count({ where: { role: "EDITOR" } });
        const readers = await database_1.prisma.user.count({ where: { role: "READER" } });
        return { total, admins, editors, readers };
    }
    /** Media metrics */
    async getMediaStats() {
        const total = await database_1.prisma.media.count();
        const images = await database_1.prisma.media.count({ where: { type: "IMAGE" } });
        const pdfs = await database_1.prisma.media.count({ where: { type: "PDF" } });
        const others = await database_1.prisma.media.count({ where: { type: "OTHER" } });
        return { total, images, pdfs, others };
    }
    /** Recent activity */
    async getRecentActivity(limit = 10) {
        const posts = await database_1.prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { author: true, category: true, tags: true },
        });
        const comments = await database_1.prisma.comment.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { author: true, post: true },
        });
        const media = await database_1.prisma.media.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
        });
        return { posts, comments, media };
    }
}
exports.adminService = new AdminService();
