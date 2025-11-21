import { prisma } from "../../config/database";
import { slugify } from "../../utils/slugify";


class TaxonomyService {
  /** Categories */
  async createCategory(name: string, description?: string) {
    const slug = await this.generateUniqueCategorySlug(name);
    return prisma.category.create({
      data: { name, slug, description },
    });
  }

  async generateUniqueCategorySlug(name: string) {
    let baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }
    return slug;
  }

  /** Tags */
  async createTag(name: string) {
    const slug = await this.generateUniqueTagSlug(name);
    return prisma.tag.create({
      data: { name, slug },
    });
  }

  async generateUniqueTagSlug(name: string) {
    let baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;
    while (await prisma.tag.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }
    return slug;
  }

  /** Assign tags to post */
  async assignTagsToPost(postId: string, tagIds: string[]) {
    return prisma.post.update({
      where: { id: postId },
      data: { tags: { set: tagIds.map(id => ({ id })) } },
      include: { tags: true },
    });
  }

  /** Fetch posts by tag slug */
  async getPostsByTag(slug: string) {
    return prisma.post.findMany({
      where: {
        tags: { some: { slug } },
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: { tags: true, author: true, category: true },
    });
  }

  /** Fetch posts by category slug */
  async getPostsByCategory(slug: string) {
    return prisma.post.findMany({
      where: {
        category: { slug },
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: { tags: true, author: true, category: true },
    });
  }
}

export const taxonomyService = new TaxonomyService();
