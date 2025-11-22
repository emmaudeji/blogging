import { Router } from "express";
import { commentController } from "./comment.controller";
import { roleGuard } from "../../middleware/roleGuard";
import { authGuard } from "../../middleware/authGuard";

export const commentRouter = Router();

// Public: anyone can create comments (guest or authenticated)
commentRouter.post("/", commentController.create);

// Fetch comments for a post
commentRouter.get("/:postId", commentController.list);

// Moderation (admin + editor)
commentRouter.patch(
  "/:id/moderate",
  authGuard,
  roleGuard(["ADMIN", "EDITOR"] as any),
  commentController.moderate
);

// Soft delete (admin/editor for now)
commentRouter.delete(
    "/:id", 
    authGuard,
    roleGuard(["ADMIN", "EDITOR"] as any),
    commentController.delete
);
