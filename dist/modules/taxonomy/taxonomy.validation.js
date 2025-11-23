"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTagSchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    description: zod_1.z.string().max(300).optional(),
});
exports.createTagSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
});
