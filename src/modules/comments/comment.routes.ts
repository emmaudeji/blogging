import { Router } from "express";
import { commentController } from "./comment.controller";
import { roleGuard } from "../../middleware/roleGuard";
 

export const commentRouter = Router();

// Public 
commentRouter.post("/", commentController.create);

// Fetch comments for a post
commentRouter.get("/:postId", commentController.list);

// Moderation (admin + editor)
commentRouter.patch(
  "/:id/moderate",
  roleGuard(["admin", "editor"]),
  commentController.moderate
);

// Soft delete (author or admin/editor)
commentRouter.delete(
    "/:id", 
    roleGuard(["admin", "editor"]),
    commentController.delete
);
