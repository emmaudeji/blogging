import { Request, Response } from "express";
import { commentService } from "./comment.service";
import {
  createCommentSchema,
  moderateCommentSchema,
} from "./comment.validation";

export class CommentController {
  async create(req: Request, res: Response) {
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const { postId, parentId, content, guestName, guestEmail } = parsed.data;
    const user = req.user;

    // For guests, require guestName and guestEmail
    if (!user && (!guestName || !guestEmail)) {
      return res.status(400).json({
        message: "guestName and guestEmail are required for anonymous comments",
      });
    }

    const result = await commentService.create({
      postId,
      parentId,
      content,
      authorId: user?.id,
      guestName: user ? undefined : guestName,
      guestEmail: user ? undefined : guestEmail,
    });

    res.status(201).json(result);
  }

  async list(req: Request, res: Response) {
    const { postId } = req.params;
    const limit = Number(req.query.limit) || 20;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

    const result = await commentService.listForPost(postId, limit, cursor);
    res.json(result);
  }

  async moderate(req: Request, res: Response) {
    const { id } = req.params;

    const parsed = moderateCommentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const result = await commentService.moderate(id, parsed.data.status);
    res.json(result);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    const result = await commentService.softDelete(id);
    res.json(result);
  }
}

export const commentController = new CommentController();
