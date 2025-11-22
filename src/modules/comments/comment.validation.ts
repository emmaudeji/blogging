import { z } from "zod";

export const createCommentSchema = z.object({
  postId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  content: z.string().min(3).max(2500),
  guestName: z.string().min(2).max(100).optional(),
  guestEmail: z.string().email().optional(),
});

export const moderateCommentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
