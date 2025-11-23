"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaController = void 0;
const media_service_1 = require("./media.service");
class MediaController {
    async upload(req, res) {
        if (!req.file)
            return res.status(400).json({ error: "No file uploaded" });
        const file = req.file;
        const type = file.mimetype.startsWith("image/") ? "IMAGE" :
            file.mimetype === "application/pdf" ? "PDF" : "OTHER";
        const media = await media_service_1.mediaService.create({
            url: file.path,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            type: type,
            postId: req.body.postId,
        });
        res.status(201).json(media);
    }
    async list(req, res) {
        const limit = Number(req.query.limit) || 20;
        const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
        const result = await media_service_1.mediaService.list(limit, cursor);
        res.json(result);
    }
    async delete(req, res) {
        const { id } = req.params;
        const result = await media_service_1.mediaService.delete(id);
        res.json(result);
    }
}
exports.mediaController = new MediaController();
