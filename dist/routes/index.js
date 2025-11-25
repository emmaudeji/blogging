"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/index.ts
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("../modules/users/user.routes"));
const post_routes_1 = __importDefault(require("../modules/posts/post.routes"));
const comment_routes_1 = require("../modules/comments/comment.routes");
const taxonomy_routes_1 = __importDefault(require("../modules/taxonomy/taxonomy.routes"));
const media_routes_1 = __importDefault(require("../modules/media/media.routes"));
const notification_routes_1 = __importDefault(require("../modules/notifications/notification.routes"));
const admin_routes_1 = __importDefault(require("../modules/admin/admin.routes"));
const editor_controller_1 = require("../modules/admin/editor.controller");
const authGuard_1 = require("../middleware/authGuard");
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/users", user_routes_1.default);
router.use("/posts", post_routes_1.default);
router.use("/comments", comment_routes_1.commentRouter);
router.use("/taxonomy", taxonomy_routes_1.default);
router.use("/media", media_routes_1.default);
router.use("/notifications", notification_routes_1.default);
router.use("/admin", admin_routes_1.default);
// Reader: create editor role request
router.post("/editor-requests", authGuard_1.authGuard, (req, res, next) => editor_controller_1.editorController.createEditorRequest(req, res, next));
exports.default = router;
