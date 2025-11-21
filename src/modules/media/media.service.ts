import { prisma } from "../../config/database";

class MediaService {
  async create(data: {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    type: "IMAGE" | "PDF" | "OTHER";
    postId?: string;
  }) {
    return prisma.media.create({ data });
  }

  async list(limit = 20, cursor?: string) {
    const media = await prisma.media.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return {
      media,
      nextCursor: media.length > 0 ? media[media.length - 1].id : null,
    };
  }

  async delete(id: string) {
    return prisma.media.delete({ where: { id } });
  }
}

export const mediaService = new MediaService();
