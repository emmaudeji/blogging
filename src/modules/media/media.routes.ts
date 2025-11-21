import { Router } from "express";
import { mediaController } from "./media.controller";
import { upload } from "./media.middleware";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

// Authenticated users upload media
router.post("/", authGuard, upload.single("file"), mediaController.upload);

// List media
router.get("/", mediaController.list);

// Delete media (admin/editor)
router.delete("/:id", roleGuard(["admin", "editor"]), mediaController.delete);

export default router;
