"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taxonomyService = void 0;
const database_1 = require("../../config/database");
const slugify_1 = require("../../utils/slugify");
class TaxonomyService {
    /** Categories */
    async createCategory(name, description) {
        const slug = await this.generateUniqueCategorySlug(name);
        return database_1.prisma.category.create({
            data: { name, slug, description },
        });
    }
    async generateUniqueCategorySlug(name) {
        let baseSlug = (0, slugify_1.slugify)(name);
        let slug = baseSlug;
        let count = 1;
        while (await database_1.prisma.category.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${count++}`;
        }
        return slug;
    }
    /** Tags */
    async createTag(name) {
        const slug = await this.generateUniqueTagSlug(name);
        return database_1.prisma.tag.create({
            data: { name, slug },
        });
    }
    async generateUniqueTagSlug(name) {
        let baseSlug = (0, slugify_1.slugify)(name);
        let slug = baseSlug;
        let count = 1;
        while (await database_1.prisma.tag.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${count++}`;
        }
        return slug;
    }
    /** Assign tags to post */
    async assignTagsToPost(postId, tagIds) {
        return database_1.prisma.post.update({
            where: { id: postId },
            data: { tags: { set: tagIds.map(id => ({ id })) } },
            include: { tags: true },
        });
    }
    /** Fetch posts by tag slug */
    async getPostsByTag(slug) {
        return database_1.prisma.post.findMany({
            where: {
                tags: { some: { slug } },
                status: "PUBLISHED",
                deletedAt: null,
            },
            include: { tags: true, author: true, category: true },
        });
    }
    /** Fetch posts by category slug */
    async getPostsByCategory(slug) {
        return database_1.prisma.post.findMany({
            where: {
                category: { slug },
                status: "PUBLISHED",
                deletedAt: null,
            },
            include: { tags: true, author: true, category: true },
        });
    }
}
exports.taxonomyService = new TaxonomyService();
