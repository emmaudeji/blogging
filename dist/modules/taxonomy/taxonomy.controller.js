"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxonomyController = exports.TaxonomyController = void 0;
const taxonomy_service_1 = require("./taxonomy.service");
const taxonomy_validation_1 = require("./taxonomy.validation");
class TaxonomyController {
    async createCategory(req, res) {
        const parsed = taxonomy_validation_1.createCategorySchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json(parsed.error);
        const result = await taxonomy_service_1.taxonomyService.createCategory(parsed.data.name, parsed.data.description);
        res.status(201).json(result);
    }
    async createTag(req, res) {
        const parsed = taxonomy_validation_1.createTagSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json(parsed.error);
        const result = await taxonomy_service_1.taxonomyService.createTag(parsed.data.name);
        res.status(201).json(result);
    }
    async assignTags(req, res) {
        const { postId } = req.params;
        const { tagIds } = req.body;
        if (!Array.isArray(tagIds))
            return res.status(400).json({ error: "tagIds must be array" });
        const result = await taxonomy_service_1.taxonomyService.assignTagsToPost(postId, tagIds);
        res.json(result);
    }
    async getPostsByTag(req, res) {
        const { slug } = req.params;
        const result = await taxonomy_service_1.taxonomyService.getPostsByTag(slug);
        res.json(result);
    }
    async getPostsByCategory(req, res) {
        const { slug } = req.params;
        const result = await taxonomy_service_1.taxonomyService.getPostsByCategory(slug);
        res.json(result);
    }
}
exports.TaxonomyController = TaxonomyController;
exports.taxonomyController = new TaxonomyController();
