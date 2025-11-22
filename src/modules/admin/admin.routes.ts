import { Router } from "express";
import { adminController } from "./admin.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

// All routes require admin
router.use(authGuard, roleGuard(["ADMIN"] as any));

router.get("/stats", adminController.stats);
router.get("/activity", adminController.recentActivity);

export default router;
