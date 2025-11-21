import { Router } from "express";
import { taxonomyController } from "./taxonomy.controller";
import { roleGuard } from "../../middleware/roleGuard";
import { authGuard } from "../../middleware/authGuard";

const router = Router();


// Public routes
router.get("/tags/:slug/posts", taxonomyController.getPostsByTag);
router.get("/categories/:slug/posts", taxonomyController.getPostsByCategory);

/**
 * AUTH + EDITOR/ADMIN ROUTES
 */
router.use(authGuard);
router.post("/categories", roleGuard(["admin", "editor"]), taxonomyController.createCategory);
router.post("/tags", roleGuard(["admin", "editor"]), taxonomyController.createTag);
router.post("/posts/:postId/tags", roleGuard(["admin", "editor"]), taxonomyController.assignTags);

export default router;
