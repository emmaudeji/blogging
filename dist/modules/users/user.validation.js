"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateUserSchema = exports.changePasswordSchema = exports.updateProfileSchema = void 0;
// src/modules/users/user.validation.ts
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    bio: zod_1.z.string().max(500).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(8),
});
exports.adminUpdateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.enum(["ADMIN", "EDITOR", "READER"]).optional(),
    bio: zod_1.z.string().max(500).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
});
