"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../../config/database");
class CommentService {
    async create(data) {
        return database_1.prisma.comment.create({
            data: {
                postId: data.postId,
                parentId: data.parentId ?? null,
                content: data.content,
                authorId: data.authorId ?? null,
                guestName: data.guestName ?? null,
                guestEmail: data.guestEmail ?? null,
                status: client_1.CommentStatus.PENDING,
            },
        });
    }
    async listForPost(postId, limit, cursor) {
        const comments = await database_1.prisma.comment.findMany({
            where: {
                postId,
                status: client_1.CommentStatus.APPROVED,
                deletedAt: null,
            },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" },
        });
        return {
            comments,
            nextCursor: comments.length > 0 ? comments[comments.length - 1].id : null,
        };
    }
    /**
     * Admin/editor listing: can see comments in any status for a post.
     * Optional status filter via query param.
     */
    async listForPostModeration(postId, limit, cursor, status) {
        const comments = await database_1.prisma.comment.findMany({
            where: {
                postId,
                deletedAt: null,
                ...(status ? { status } : {}),
            },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" },
        });
        return {
            comments,
            nextCursor: comments.length > 0 ? comments[comments.length - 1].id : null,
        };
    }
    async moderate(id, status) {
        return database_1.prisma.comment.update({
            where: { id },
            data: { status },
        });
    }
    async softDelete(id) {
        return database_1.prisma.comment.update({
            where: { id },
            data: {
                content: "[deleted]",
                deletedAt: new Date(),
            },
        });
    }
    /** Optional: fetch comment thread (parent + replies) */
    async getThread(commentId) {
        return database_1.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                replies: true,
            },
        });
    }
}
exports.commentService = new CommentService();
// Soft Delete Policy
// ❌ Hard delete (not recommended for production)
// Instead:
// Replace content with "[deleted]"
// Keep timestamps and author for moderation history
// Thread structure remains intact
