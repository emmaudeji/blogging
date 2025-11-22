// src/modules/users/user.validation.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "EDITOR", "READER"]).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});
