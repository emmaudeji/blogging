import { Router } from "express";
import { mediaController } from "./media.controller";
import { upload } from "./media.middleware";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

// Authenticated users upload media
router.post("/", authGuard, upload.single("file"), mediaController.upload);

// List media (public)
router.get("/", mediaController.list);

// Delete media (admin/editor)
router.delete(
  "/:id",
  authGuard,
  roleGuard(["ADMIN", "EDITOR"] as any),
  mediaController.delete
);

export default router;
