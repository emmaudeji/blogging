"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateCommentSchema = exports.createCommentSchema = void 0;
const zod_1 = require("zod");
exports.createCommentSchema = zod_1.z.object({
    postId: zod_1.z.string().min(1),
    parentId: zod_1.z.string().min(1).optional(),
    content: zod_1.z.string().min(3).max(2500),
    guestName: zod_1.z.string().min(2).max(100).optional(),
    guestEmail: zod_1.z.string().email().optional(),
});
exports.moderateCommentSchema = zod_1.z.object({
    status: zod_1.z.enum(["APPROVED", "REJECTED"]),
});
