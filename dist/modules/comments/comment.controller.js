"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentController = exports.CommentController = void 0;
const comment_service_1 = require("./comment.service");
const comment_validation_1 = require("./comment.validation");
class CommentController {
    async create(req, res) {
        const parsed = comment_validation_1.createCommentSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json(parsed.error);
        const { postId, parentId, content, guestName, guestEmail } = parsed.data;
        const user = req.user;
        // For guests, require guestName and guestEmail
        if (!user && (!guestName || !guestEmail)) {
            return res.status(400).json({
                message: "guestName and guestEmail are required for anonymous comments",
            });
        }
        const result = await comment_service_1.commentService.create({
            postId,
            parentId,
            content,
            authorId: user?.id,
            guestName: user ? undefined : guestName,
            guestEmail: user ? undefined : guestEmail,
        });
        res.status(201).json(result);
    }
    async list(req, res) {
        const { postId } = req.params;
        const limit = Number(req.query.limit) || 20;
        const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
        const result = await comment_service_1.commentService.listForPost(postId, limit, cursor);
        res.json(result);
    }
    async moderate(req, res) {
        const { id } = req.params;
        const parsed = comment_validation_1.moderateCommentSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json(parsed.error);
        const result = await comment_service_1.commentService.moderate(id, parsed.data.status);
        res.json(result);
    }
    async delete(req, res) {
        const { id } = req.params;
        const result = await comment_service_1.commentService.softDelete(id);
        res.json(result);
    }
}
exports.CommentController = CommentController;
exports.commentController = new CommentController();
