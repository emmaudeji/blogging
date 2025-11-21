import { Request, Response } from "express";
import { taxonomyService } from "./taxonomy.service";
import { createCategorySchema, createTagSchema } from "./taxonomy.validation";

export class TaxonomyController {
  async createCategory(req: Request, res: Response) {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const result = await taxonomyService.createCategory(parsed.data.name, parsed.data.description);
    res.status(201).json(result);
  }

  async createTag(req: Request, res: Response) {
    const parsed = createTagSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const result = await taxonomyService.createTag(parsed.data.name);
    res.status(201).json(result);
  }

  async assignTags(req: Request, res: Response) {
    const { postId } = req.params;
    const { tagIds } = req.body;
    if (!Array.isArray(tagIds)) return res.status(400).json({ error: "tagIds must be array" });

    const result = await taxonomyService.assignTagsToPost(postId, tagIds);
    res.json(result);
  }

  async getPostsByTag(req: Request, res: Response) {
    const { slug } = req.params;
    const result = await taxonomyService.getPostsByTag(slug);
    res.json(result);
  }

  async getPostsByCategory(req: Request, res: Response) {
    const { slug } = req.params;
    const result = await taxonomyService.getPostsByCategory(slug);
    res.json(result);
  }
}

export const taxonomyController = new TaxonomyController();
