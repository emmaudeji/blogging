"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postController = exports.PostController = void 0;
const post_service_1 = require("./post.service");
class PostController {
    async create(req, res, next) {
        try {
            const result = await post_service_1.postService.create(req.user.id, req.body);
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const result = await post_service_1.postService.update(id, req.body, req.user.id, req.user.role);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async remove(req, res, next) {
        try {
            const { id } = req.params;
            await post_service_1.postService.softDelete(id, req.user.id, req.user.role);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
    async getBySlug(req, res, next) {
        try {
            const slug = req.params.slug;
            const post = await post_service_1.postService.getBySlug(slug);
            if (!post)
                return res.status(404).json({ message: "Not found" });
            res.json(post);
        }
        catch (err) {
            next(err);
        }
    }
    async list(req, res, next) {
        try {
            const { cursor, limit, q } = req.query;
            const result = await post_service_1.postService.listCursor({
                cursor: typeof cursor === "string" ? cursor : undefined,
                limit: limit ? Number(limit) : undefined,
                query: typeof q === "string" ? q : undefined,
                // Public listing should only return published posts
                publishedOnly: true,
            });
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PostController = PostController;
exports.postController = new PostController();
