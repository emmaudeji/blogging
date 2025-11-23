"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taxonomy_controller_1 = require("./taxonomy.controller");
const roleGuard_1 = require("../../middleware/roleGuard");
const authGuard_1 = require("../../middleware/authGuard");
const router = (0, express_1.Router)();
// Public routes
router.get("/tags/:slug/posts", taxonomy_controller_1.taxonomyController.getPostsByTag);
router.get("/categories/:slug/posts", taxonomy_controller_1.taxonomyController.getPostsByCategory);
/**
 * AUTH + EDITOR/ADMIN ROUTES
 */
router.use(authGuard_1.authGuard);
router.post("/categories", (0, roleGuard_1.roleGuard)(["ADMIN", "EDITOR"]), taxonomy_controller_1.taxonomyController.createCategory);
router.post("/tags", (0, roleGuard_1.roleGuard)(["ADMIN", "EDITOR"]), taxonomy_controller_1.taxonomyController.createTag);
router.post("/posts/:postId/tags", (0, roleGuard_1.roleGuard)(["ADMIN", "EDITOR"]), taxonomy_controller_1.taxonomyController.assignTags);
exports.default = router;
