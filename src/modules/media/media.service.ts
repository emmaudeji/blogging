import { prisma } from "../../config/database";
import { MediaType } from "@prisma/client";
import { BadRequestError } from "../../utils/errors";

class MediaService {
  async create(data: {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
    type: MediaType;
    postId?: string;
  }) {
    if (data.postId) {
      const post = await prisma.post.findFirst({
        where: { id: data.postId, deletedAt: null },
        select: { id: true },
      });
      if (!post) {
        throw new BadRequestError("Invalid postId: post does not exist or is deleted");
      }
    }

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
