 
import { CommentStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import { notificationService } from "../notifications/notification.service";
import { NotificationTypes } from "../notifications/notification.types";

class CommentService {
  async create(data: {
    postId: string;
    parentId?: string;
    content: string;
    authorId?: string;
    guestName?: string;
    guestEmail?: string;
  }) {
    const comment = await prisma.comment.create({
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

    // Notify the post author that a new comment is pending moderation
    const post = await prisma.post.findUnique({
      where: { id: data.postId },
      select: { id: true, authorId: true },
    });
    if (post?.authorId) {
      await notificationService.create(
        post.authorId,
        NotificationTypes.COMMENT_PENDING_MODERATION,
        "New comment awaiting moderation",
        "A new comment has been submitted on your post.",
        { postId: post.id, commentId: comment.id }
      );
    }

    return comment;
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
    const comment = await prisma.comment.update({
      where: { id },
      data: { status },
    });

    // Notify the comment author if this was an authenticated user
    if (comment.authorId) {
      const type =
        status === CommentStatus.APPROVED
          ? NotificationTypes.COMMENT_APPROVED
          : NotificationTypes.COMMENT_REJECTED;
      const subject =
        status === CommentStatus.APPROVED
          ? "Your comment was approved"
          : "Your comment was rejected";
      const message =
        status === CommentStatus.APPROVED
          ? "Your comment has been approved and is now visible."
          : "Your comment has been rejected by a moderator.";

      await notificationService.create(
        comment.authorId,
        type,
        subject,
        message,
        { commentId: comment.id, postId: comment.postId, status }
      );
    }

    return comment;
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