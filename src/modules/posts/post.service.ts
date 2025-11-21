import { prisma } from "../../config/database";
import { createPostSchema, updatePostSchema } from "./post.validation";
import { slugify } from "../../utils/slugify";
import {
  CursorPaginationParams,
  CursorPageResponse,
  normalizeLimit,
} from "../../utils/pagination";
import { Post, Prisma } from "@prisma/client";

export class PostService {
  /** Create unique slug */
  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const exists = await prisma.post.findUnique({ where: { slug } });
      if (!exists) return slug;
      slug = `${baseSlug}-${count++}`;
    }
  }

  async create(authorId: string, payload: unknown) {
    const data = createPostSchema.parse(payload);

    const slug = await this.generateUniqueSlug(data.title);

    return await prisma.post.create({
      data: {
        ...data,
        slug,
        authorId,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
    });
  }

  async update(id: string, payload: unknown, requestingUserId: string, role: string) {
    const post = await prisma.post.findFirst({
      where: { id, deletedAt: null },
    });
    if (!post) throw new Error("Post not found");

    // Editors can only update their own posts
    if (role === "editor" && post.authorId !== requestingUserId) {
      throw new Error("Forbidden");
    }

    const data = updatePostSchema.parse(payload);

    // regenerate slug if title changed
    if (data.title) {
      data.slug = await this.generateUniqueSlug(data.title);
    }

    return prisma.post.update({
      where: { id },
      data: {
        ...data,
        publishedAt:
          data.status === "PUBLISHED" ? new Date() : post.publishedAt,
      },
    });
  }

  async softDelete(id: string, requestingUserId: string, role: string) {
    const post = await prisma.post.findFirst({
      where: { id, deletedAt: null },
    });
    if (!post) throw new Error("Post not found");

    if (role === "editor" && post.authorId !== requestingUserId) {
      throw new Error("Forbidden");
    }

    return prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** PUBLIC: Get post by slug */
  async getBySlug(slug: string) {
    return prisma.post.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        deletedAt: null,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /** Cursor pagination for posts */
  async listCursor(params: {
    cursor?: string;
    limit?: number;
    query?: string;
    publishedOnly?: boolean;
  }): Promise<CursorPageResponse<Post>> {
    const { cursor, query, publishedOnly } = params;
    const limit = normalizeLimit(params.limit);

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(publishedOnly ? { status: "PUBLISHED" } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
              { tags: { has: query.toLowerCase() } },
            ],
          }
        : {}),
    };

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    let nextCursor: string | null = null;

    if (posts.length > limit) {
      const nextItem = posts.pop();
      if (nextItem) nextCursor = nextItem.id;
    }

    return { data: posts, nextCursor };
  }
}

export const postService = new PostService();
