"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_controller_1 = require("./media.controller");
const media_middleware_1 = require("./media.middleware");
const authGuard_1 = require("../../middleware/authGuard");
const roleGuard_1 = require("../../middleware/roleGuard");
const router = (0, express_1.Router)();
// Authenticated users upload media
router.post("/", authGuard_1.authGuard, media_middleware_1.upload.single("file"), media_controller_1.mediaController.upload);
// List media (public)
router.get("/", media_controller_1.mediaController.list);
// Delete media (admin/editor)
router.delete("/:id", authGuard_1.authGuard, (0, roleGuard_1.roleGuard)(["ADMIN", "EDITOR"]), media_controller_1.mediaController.delete);
exports.default = router;
