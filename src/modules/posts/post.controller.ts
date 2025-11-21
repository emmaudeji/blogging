import { Request, Response, NextFunction } from "express";
import { postService } from "./post.service";

export class PostController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await postService.create(req.user!.id, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await postService.update(
        id,
        req.body,
        req.user!.id,
        req.user!.role
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await postService.softDelete(id, req.user!.id, req.user!.role);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug;
      const post = await postService.getBySlug(slug);
      if (!post) return res.status(404).json({ message: "Not found" });
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { cursor, limit, q, published } = req.query;

      const result = await postService.listCursor({
        cursor: typeof cursor === "string" ? cursor : undefined,
        limit: limit ? Number(limit) : undefined,
        query: typeof q === "string" ? q : undefined,
        publishedOnly: published === "true",
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const postController = new PostController();
