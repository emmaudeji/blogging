import { Router } from "express";
import { postController } from "./post.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

/**
 * PUBLIC ROUTES
 */
router.get("/:slug", (req, res, next) =>
  postController.getBySlug(req, res, next)
);

router.get("/", (req, res, next) =>
  postController.list(req, res, next)
);

/**
 * AUTH + EDITOR/ADMIN ROUTES
 */
router.use(authGuard);

router.post("/", roleGuard(["ADMIN", "EDITOR"] as any), (req, res, next) =>
  postController.create(req, res, next)
);

router.patch("/:id", roleGuard(["ADMIN", "EDITOR"] as any), (req, res, next) =>
  postController.update(req, res, next)
);

router.delete("/:id", roleGuard(["ADMIN", "EDITOR"] as any), (req, res, next) =>
  postController.remove(req, res, next)
);

export default router;
