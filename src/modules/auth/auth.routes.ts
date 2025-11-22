// src/modules/auth/auth.routes.ts
import { Router } from "express";
import { authController } from "./auth.controller";
import { authGuard } from "../../middleware/authGuard";
import { editorController } from "../admin/editor.controller";

const router = Router();

router.post("/register", (req, res, next) =>
  authController.register(req, res, next)
);

router.post("/login", (req, res, next) =>
  authController.login(req, res, next)
);

router.post("/logout", authGuard, (req, res, next) =>
  authController.logout(req, res, next)
);

router.get("/me", authGuard, (req, res, next) =>
  authController.me(req, res, next)
);

// Public: accept editor/admin invite
router.post("/accept-editor-invite", (req, res, next) =>
  editorController.acceptInvite(req, res, next)
);

export default router;
