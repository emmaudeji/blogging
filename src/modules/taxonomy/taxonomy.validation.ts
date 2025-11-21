import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(2).max(50),
});
