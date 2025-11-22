import { Router } from "express";
import { adminController } from "./admin.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";
import { editorController } from "./editor.controller";

const router = Router();

// All /admin routes require admin
router.use(authGuard, roleGuard(["ADMIN"] as any));

// Admin dashboard
router.get("/stats", adminController.stats);
router.get("/activity", adminController.recentActivity);

// Editor invites
router.post("/editor-invites", editorController.createInvite);
router.get("/editor-invites", editorController.listInvites);

// Editor role requests
router.get("/editor-requests", editorController.listEditorRequests);
router.patch("/editor-requests/:id", editorController.decideEditorRequest);

export default router;
