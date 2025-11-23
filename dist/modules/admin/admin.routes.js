"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const authGuard_1 = require("../../middleware/authGuard");
const roleGuard_1 = require("../../middleware/roleGuard");
const editor_controller_1 = require("./editor.controller");
const router = (0, express_1.Router)();
// All /admin routes require admin
router.use(authGuard_1.authGuard, (0, roleGuard_1.roleGuard)(["ADMIN"]));
// Admin dashboard
router.get("/stats", admin_controller_1.adminController.stats);
router.get("/activity", admin_controller_1.adminController.recentActivity);
// Editor invites
router.post("/editor-invites", editor_controller_1.editorController.createInvite);
router.get("/editor-invites", editor_controller_1.editorController.listInvites);
// Editor role requests
router.get("/editor-requests", editor_controller_1.editorController.listEditorRequests);
router.patch("/editor-requests/:id", editor_controller_1.editorController.decideEditorRequest);
exports.default = router;
