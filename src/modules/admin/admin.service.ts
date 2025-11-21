import { prisma } from "../../config/database";

class AdminService {
  /** Posts metrics */
  async getPostsStats() {
    const total = await prisma.post.count();
    const draft = await prisma.post.count({ where: { status: "DRAFT" } });
    const published = await prisma.post.count({ where: { status: "PUBLISHED" } });

    return { total, draft, published };
  }

  /** Comments metrics */
  async getCommentsStats() {
    const total = await prisma.comment.count();
    const pending = await prisma.comment.count({ where: { status: "PENDING" } });
    const approved = await prisma.comment.count({ where: { status: "APPROVED" } });
    const rejected = await prisma.comment.count({ where: { status: "REJECTED" } });

    return { total, pending, approved, rejected };
  }

  /** Users metrics */
  async getUsersStats() {
    const total = await prisma.user.count();
    const admins = await prisma.user.count({ where: { role: "admin" } });
    const editors = await prisma.user.count({ where: { role: "editor" } });
    const readers = await prisma.user.count({ where: { role: "reader" } });

    return { total, admins, editors, readers };
  }

  /** Media metrics */
  async getMediaStats() {
    const total = await prisma.media.count();
    const images = await prisma.media.count({ where: { type: "IMAGE" } });
    const pdfs = await prisma.media.count({ where: { type: "PDF" } });
    const others = await prisma.media.count({ where: { type: "OTHER" } });

    return { total, images, pdfs, others };
  }

  /** Recent activity */
  async getRecentActivity(limit = 10) {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { author: true, category: true, tags: true },
    });

    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { author: true, post: true },
    });

    const media = await prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { posts, comments, media };
  }
}

export const adminService = new AdminService();

// TODO: REVIEW. Production Best Practices

// Admin-only access → use requireRole(["admin"])

// Parallelize counts → Promise.all for performance

// Pagination for recent activity → cursor-based or offset-based

// Avoid sensitive data → only include necessary fields for dashboard

// Caching → optional: Redis for stats that rarely change (total counts)

// Logs + Monitoring → track slow queries or high-load endpoints