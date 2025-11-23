"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostSchema = exports.createPostSchema = void 0;
const zod_1 = require("zod");
exports.createPostSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    content: zod_1.z.string().min(10),
    excerpt: zod_1.z.string().max(300).optional(),
    status: zod_1.z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});
exports.updatePostSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).optional(),
    content: zod_1.z.string().min(10).optional(),
    excerpt: zod_1.z.string().max(300).optional(),
    status: zod_1.z.enum(["DRAFT", "PUBLISHED"]).optional(),
});
