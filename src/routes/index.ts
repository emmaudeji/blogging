// src/routes/index.ts
import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";
import postRoutes from "../modules/posts/post.routes";
import { commentRouter } from "../modules/comments/comment.routes";
import taxonomyRoutes from "../modules/taxonomy/taxonomy.routes";
import mediaRoutes from "../modules/media/media.routes";
// import notificationRoutes from "../modules/notifications/notification.routes";
import adminRoutes from "../modules/admin/admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRouter);
router.use("/taxonomy", taxonomyRoutes);
router.use("/media", mediaRoutes);
// router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

export default router;
