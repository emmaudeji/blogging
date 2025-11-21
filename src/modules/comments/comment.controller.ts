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

    const result = await commentService.create({
      ...parsed.data,
      authorId: req.user.id, // from auth middleware
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
