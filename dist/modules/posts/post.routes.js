"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = require("./post.controller");
const authGuard_1 = require("../../middleware/authGuard");
const roleGuard_1 = require("../../middleware/roleGuard");
const router = (0, express_1.Router)();
/**
 * PUBLIC ROUTES
 */
router.get("/slug/:slug", (req, res, next) => post_controller_1.postController.getBySlug(req, res, next));
router.get("/", (req, res, next) => post_controller_1.postController.list(req, res, next));
/**
 * AUTH + EDITOR/ADMIN ROUTES
 */
router.use(authGuard_1.authGuard);
router.post("/", (0, roleGuard_1.roleGuard)(["ADMIN", "EDITOR"]), (req, res, next) => post_controller_1.postController.create(req, res, next));
router.patch("/:id", (0, roleGuard_1.roleGuard)(["ADMIN", "EDITOR"]), (req, res, next) => post_controller_1.postController.update(req, res, next));
router.delete("/:id", (0, roleGuard_1.roleGuard)(["ADMIN", "EDITOR"]), (req, res, next) => post_controller_1.postController.remove(req, res, next));
exports.default = router;
