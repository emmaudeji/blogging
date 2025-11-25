"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const database_1 = require("../../config/database");
const post_validation_1 = require("./post.validation");
const slugify_1 = require("../../utils/slugify");
const notification_service_1 = require("../notifications/notification.service");
const notification_types_1 = require("../notifications/notification.types");
const pagination_1 = require("../../utils/pagination");
const client_1 = require("@prisma/client");
const errors_1 = require("../../utils/errors");
class PostService {
    /** Create unique slug */
    async generateUniqueSlug(title) {
        const baseSlug = (0, slugify_1.slugify)(title);
        let slug = baseSlug;
        let count = 1;
        while (true) {
            const exists = await database_1.prisma.post.findUnique({ where: { slug } });
            if (!exists)
                return slug;
            slug = `${baseSlug}-${count++}`;
        }
    }
    async create(authorId, payload) {
        const data = post_validation_1.createPostSchema.parse(payload);
        const slug = await this.generateUniqueSlug(data.title);
        const post = await database_1.prisma.post.create({
            data: {
                ...data,
                slug,
                authorId,
                publishedAt: data.status === "PUBLISHED" ? new Date() : null,
            },
        });
        // If created as PUBLISHED, notify the author
        if (post.status === "PUBLISHED") {
            await notification_service_1.notificationService.create(authorId, notification_types_1.NotificationTypes.POST_PUBLISHED, "Post published", "Your post has been published.", { postId: post.id, slug: post.slug });
        }
        return post;
    }
    async update(id, payload, requestingUserId, role) {
        const post = await database_1.prisma.post.findFirst({
            where: { id, deletedAt: null },
        });
        if (!post)
            throw new errors_1.NotFoundError("Post not found");
        // Editors can only update their own posts
        if (role === "EDITOR" && post.authorId !== requestingUserId) {
            throw new errors_1.ForbiddenError("You can only modify your own posts");
        }
        const data = post_validation_1.updatePostSchema.parse(payload);
        // Build update payload and regenerate slug if title changed
        const updateData = { ...data };
        if (data.title) {
            updateData.slug = await this.generateUniqueSlug(data.title);
        }
        const updated = await database_1.prisma.post.update({
            where: { id },
            data: {
                ...updateData,
                publishedAt: updateData.status === "PUBLISHED" ? new Date() : post.publishedAt,
            },
        });
        // Notify the author if the post was published or updated by someone else
        if (updated.authorId) {
            if (post.status !== "PUBLISHED" && updated.status === "PUBLISHED") {
                await notification_service_1.notificationService.create(updated.authorId, notification_types_1.NotificationTypes.POST_PUBLISHED, "Post published", "Your post has been published.", { postId: updated.id, slug: updated.slug });
            }
            else {
                await notification_service_1.notificationService.create(updated.authorId, notification_types_1.NotificationTypes.POST_UPDATED, "Post updated", "Your post has been updated.", { postId: updated.id, slug: updated.slug });
            }
        }
        return updated;
    }
    async softDelete(id, requestingUserId, role) {
        const post = await database_1.prisma.post.findFirst({
            where: { id, deletedAt: null },
        });
        if (!post)
            throw new errors_1.NotFoundError("Post not found");
        if (role === "EDITOR" && post.authorId !== requestingUserId) {
            throw new errors_1.ForbiddenError("You can only modify your own posts");
        }
        const updated = await database_1.prisma.post.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        if (post.authorId) {
            await notification_service_1.notificationService.create(post.authorId, notification_types_1.NotificationTypes.POST_DELETED, "Post deleted", "Your post has been deleted.", { postId: updated.id });
        }
        return updated;
    }
    /** PUBLIC: Get post by slug */
    async getBySlug(slug) {
        return database_1.prisma.post.findFirst({
            where: {
                slug,
                status: "PUBLISHED",
                deletedAt: null,
            },
            include: {
                author: {
                    select: { id: true, name: true },
                },
                category: true,
                tags: true,
                media: {
                    where: { type: client_1.MediaType.IMAGE },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
    }
    /** Cursor pagination for posts */
    async listCursor(params) {
        const { cursor, query, publishedOnly } = params;
        const limit = (0, pagination_1.normalizeLimit)(params.limit);
        const where = {
            deletedAt: null,
            ...(publishedOnly ? { status: "PUBLISHED" } : {}),
            ...(query
                ? {
                    OR: [
                        { title: { contains: query, mode: "insensitive" } },
                        { content: { contains: query, mode: "insensitive" } },
                    ],
                }
                : {}),
        };
        const posts = await database_1.prisma.post.findMany({
            where,
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
            orderBy: { createdAt: "desc" },
            include: {
                author: { select: { id: true, name: true } },
                category: true,
                media: {
                    where: { type: client_1.MediaType.IMAGE },
                    take: 1,
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        let nextCursor = null;
        if (posts.length > limit) {
            const nextItem = posts.pop();
            if (nextItem)
                nextCursor = nextItem.id;
        }
        return { data: posts, nextCursor };
    }
}
exports.PostService = PostService;
exports.postService = new PostService();
