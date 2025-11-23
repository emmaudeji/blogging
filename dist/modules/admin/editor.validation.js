"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideEditorRequestSchema = exports.createEditorRequestSchema = exports.acceptEditorInviteSchema = exports.createEditorInviteSchema = void 0;
// src/modules/admin/editor.validation.ts
const zod_1 = require("zod");
exports.createEditorInviteSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    // allow future extension to invite ADMINs; default EDITOR
    role: zod_1.z.enum(["EDITOR", "ADMIN"]).default("EDITOR"),
    // optional: invite expiration in days
    expiresInDays: zod_1.z.number().int().positive().max(365).optional(),
});
exports.acceptEditorInviteSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    name: zod_1.z.string().min(2),
    password: zod_1.z.string().min(8).max(72),
});
exports.createEditorRequestSchema = zod_1.z.object({
    note: zod_1.z.string().max(500).optional(),
});
exports.decideEditorRequestSchema = zod_1.z.object({
    status: zod_1.z.enum(["APPROVED", "REJECTED"]),
    note: zod_1.z.string().max(500).optional(),
});
