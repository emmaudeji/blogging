// src/modules/admin/editor.validation.ts
import { z } from "zod";

export const createEditorInviteSchema = z.object({
  email: z.string().email(),
  // allow future extension to invite ADMINs; default EDITOR
  role: z.enum(["EDITOR", "ADMIN"]).default("EDITOR"),
  // optional: invite expiration in days
  expiresInDays: z.number().int().positive().max(365).optional(),
});

export type CreateEditorInviteInput = z.infer<typeof createEditorInviteSchema>;

export const acceptEditorInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2),
  password: z.string().min(8).max(72),
});

export type AcceptEditorInviteInput = z.infer<typeof acceptEditorInviteSchema>;

export const createEditorRequestSchema = z.object({
  note: z.string().max(500).optional(),
});

export type CreateEditorRequestInput = z.infer<typeof createEditorRequestSchema>;

export const decideEditorRequestSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(500).optional(),
});

export type DecideEditorRequestInput = z.infer<typeof decideEditorRequestSchema>;
