"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = void 0;
const client_1 = require("@prisma/client");
const database_1 = require("../../config/database");
const notification_service_1 = require("../notifications/notification.service");
const notification_types_1 = require("../notifications/notification.types");
class CommentService {
    async create(data) {
        const comment = await database_1.prisma.comment.create({
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
        // Notify the post author that a new comment is pending moderation
        const post = await database_1.prisma.post.findUnique({
            where: { id: data.postId },
            select: { id: true, authorId: true },
        });
        if (post?.authorId) {
            await notification_service_1.notificationService.create(post.authorId, notification_types_1.NotificationTypes.COMMENT_PENDING_MODERATION, "New comment awaiting moderation", "A new comment has been submitted on your post.", { postId: post.id, commentId: comment.id });
        }
        return comment;
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
        const comment = await database_1.prisma.comment.update({
            where: { id },
            data: { status },
        });
        // Notify the comment author if this was an authenticated user
        if (comment.authorId) {
            const type = status === client_1.CommentStatus.APPROVED
                ? notification_types_1.NotificationTypes.COMMENT_APPROVED
                : notification_types_1.NotificationTypes.COMMENT_REJECTED;
            const subject = status === client_1.CommentStatus.APPROVED
                ? "Your comment was approved"
                : "Your comment was rejected";
            const message = status === client_1.CommentStatus.APPROVED
                ? "Your comment has been approved and is now visible."
                : "Your comment has been rejected by a moderator.";
            await notification_service_1.notificationService.create(comment.authorId, type, subject, message, { commentId: comment.id, postId: comment.postId, status });
        }
        return comment;
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
