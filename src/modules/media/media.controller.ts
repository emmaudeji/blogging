import { Request, Response } from "express";
import { mediaService } from "./media.service";

class MediaController {
  async upload(req: Request, res: Response) {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.file;

    const type =
      file.mimetype.startsWith("image/") ? "IMAGE" :
      file.mimetype === "application/pdf" ? "PDF" : "OTHER";

    const media = await mediaService.create({
      url: file.path,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      type: type as any,
      postId: req.body.postId,
    });

    res.status(201).json(media);
  }

  async list(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    const result = await mediaService.list(limit, cursor);
    res.json(result);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const result = await mediaService.delete(id);
    res.json(result);
  }
}

export const mediaController = new MediaController();
