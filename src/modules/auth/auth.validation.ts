// src/modules/auth/auth.validation.ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  // bcrypt has a 72 byte limit; enforce a reasonable min/max here
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  name: z.string().min(2),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
