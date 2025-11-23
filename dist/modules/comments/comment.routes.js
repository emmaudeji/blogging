"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentRouter = void 0;
const express_1 = require("express");
const comment_controller_1 = require("./comment.controller");
const roleGuard_1 = require("../../middleware/roleGuard");
const authGuard_1 = require("../../middleware/authGuard");
exports.commentRouter = (0, express_1.Router)();
// Public: anyone can create comments (guest or authenticated)
exports.commentRouter.post("/", comment_controller_1.commentController.create);
// Fetch comments for a post
exports.commentRouter.get("/:postId", comment_controller_1.commentController.list);
// Moderation (admin + editor)
exports.commentRouter.patch("/:id/moderate", authGuard_1.authGuard, (0, roleGuard_1.roleGuard)(["ADMIN", "EDITOR"]), comment_controller_1.commentController.moderate);
// Soft delete (admin/editor for now)
exports.commentRouter.delete("/:id", authGuard_1.authGuard, (0, roleGuard_1.roleGuard)(["ADMIN", "EDITOR"]), comment_controller_1.commentController.delete);
