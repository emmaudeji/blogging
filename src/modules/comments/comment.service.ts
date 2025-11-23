 
import { CommentStatus } from "@prisma/client";
import { prisma } from "../../config/database";

class CommentService {
  async create(data: {
    postId: string;
    parentId?: string;
    content: string;
    authorId?: string;
    guestName?: string;
    guestEmail?: string;
  }) {
    return prisma.comment.create({
      data: {
        postId: data.postId,
        parentId: data.parentId ?? null,
        content: data.content,
        authorId: data.authorId ?? null,
        guestName: data.guestName ?? null,
        guestEmail: data.guestEmail ?? null,
        status: CommentStatus.PENDING,
      },
    });
  }

  async listForPost(postId: string, limit: number, cursor?: string) {
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        status: CommentStatus.APPROVED,
        deletedAt: null,
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return {
      comments,
      nextCursor:
        comments.length > 0 ? comments[comments.length - 1].id : null,
    };
  }

  /**
   * Admin/editor listing: can see comments in any status for a post.
   * Optional status filter via query param.
   */
  async listForPostModeration(
    postId: string,
    limit: number,
    cursor?: string,
    status?: CommentStatus
  ) {
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return {
      comments,
      nextCursor:
        comments.length > 0 ? comments[comments.length - 1].id : null,
    };
  }

  async moderate(id: string, status: CommentStatus) {
    return prisma.comment.update({
      where: { id },
      data: { status },
    });
  }

  async softDelete(id: string) {
    return prisma.comment.update({
      where: { id },
      data: {
        content: "[deleted]",
        deletedAt: new Date(),
      },
    });
  }

  /** Optional: fetch comment thread (parent + replies) */
  async getThread(commentId: string) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        replies: true,
      },
    });
  }
}

export const commentService = new CommentService();


// Soft Delete Policy

// ❌ Hard delete (not recommended for production)

// Instead:

// Replace content with "[deleted]"

// Keep timestamps and author for moderation history

// Thread structure remains intact