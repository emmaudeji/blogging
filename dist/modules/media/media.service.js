"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaService = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
class MediaService {
    async create(data) {
        if (data.postId) {
            const post = await database_1.prisma.post.findFirst({
                where: { id: data.postId, deletedAt: null },
                select: { id: true },
            });
            if (!post) {
                throw new errors_1.BadRequestError("Invalid postId: post does not exist or is deleted");
            }
        }
        return database_1.prisma.media.create({ data });
    }
    async list(limit = 20, cursor) {
        const media = await database_1.prisma.media.findMany({
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" },
        });
        return {
            media,
            nextCursor: media.length > 0 ? media[media.length - 1].id : null,
        };
    }
    async delete(id) {
        return database_1.prisma.media.delete({ where: { id } });
    }
}
exports.mediaService = new MediaService();
