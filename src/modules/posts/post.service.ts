import { prisma } from "../../config/database";
import { createPostSchema, updatePostSchema } from "./post.validation";
import { slugify } from "../../utils/slugify";
import {
  CursorPaginationParams,
  CursorPageResponse,
  normalizeLimit,
} from "../../utils/pagination";
import { Post, Prisma, MediaType } from "@prisma/client";
import { NotFoundError, ForbiddenError } from "../../utils/errors";

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
    if (!post) throw new NotFoundError("Post not found");

    // Editors can only update their own posts
    if (role === "EDITOR" && post.authorId !== requestingUserId) {
      throw new ForbiddenError("You can only modify your own posts");
    }

    const data = updatePostSchema.parse(payload);

    // Build update payload and regenerate slug if title changed
    const updateData: any = { ...data };

    if (data.title) {
      updateData.slug = await this.generateUniqueSlug(data.title);
    }

    return prisma.post.update({
      where: { id },
      data: {
        ...updateData,
        publishedAt:
          updateData.status === "PUBLISHED" ? new Date() : post.publishedAt,
      },
    });
  }

  async softDelete(id: string, requestingUserId: string, role: string) {
    const post = await prisma.post.findFirst({
      where: { id, deletedAt: null },
    });
    if (!post) throw new NotFoundError("Post not found");

    if (role === "EDITOR" && post.authorId !== requestingUserId) {
      throw new ForbiddenError("You can only modify your own posts");
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
        category: true,
        tags: true,
        media: {
          where: { type: MediaType.IMAGE },
          orderBy: { createdAt: "asc" },
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
        category: true,
        media: {
          where: { type: MediaType.IMAGE },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
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
