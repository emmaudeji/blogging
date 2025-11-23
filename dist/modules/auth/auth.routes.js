"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/auth/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const authGuard_1 = require("../../middleware/authGuard");
const editor_controller_1 = require("../admin/editor.controller");
const router = (0, express_1.Router)();
router.post("/register", (req, res, next) => auth_controller_1.authController.register(req, res, next));
router.post("/login", (req, res, next) => auth_controller_1.authController.login(req, res, next));
router.post("/logout", authGuard_1.authGuard, (req, res, next) => auth_controller_1.authController.logout(req, res, next));
router.get("/me", authGuard_1.authGuard, (req, res, next) => auth_controller_1.authController.me(req, res, next));
// Public: accept editor/admin invite
router.post("/accept-editor-invite", (req, res, next) => editor_controller_1.editorController.acceptInvite(req, res, next));
exports.default = router;
