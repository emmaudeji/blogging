import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  excerpt: z.string().max(300).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const updatePostSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(10).optional(),
  excerpt: z.string().max(300).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});
