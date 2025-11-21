// src/modules/users/user.routes.ts
import { Router } from "express";
import { userController } from "./user.controller";
import { authGuard } from "../../middleware/authGuard";
import { roleGuard } from "../../middleware/roleGuard";

const router = Router();

// Public (none) - all user endpoints are protected
router.use(authGuard);

// Current user profile
router.get("/me", (req, res, next) => userController.me(req, res, next));
router.patch("/me", (req, res, next) => userController.updateProfile(req, res, next));
router.post("/me/change-password", (req, res, next) =>
  userController.changePassword(req, res, next)
);

// Admin-only routes
router.get(
  "/",
  roleGuard(["admin"]),
  (req, res, next) => userController.list(req, res, next)
);


// | Endpoint                                    | Pagination Type   | Example                                    |
// | ------------------------------------------- | ----------------- | ------------------------------------------ |
// | `/users?skip=0&take=20&q=john`              | Offset pagination | ideal for admin UI with page numbers       |
// | `/users/cursor?cursor=<id>&limit=20&q=john` | Cursor pagination | best for infinite scrolling, huge datasets |
router.get(
  "/cursor",
  roleGuard(["admin"]),
  (req, res, next) => userController.listCursor(req, res, next)
);
// GET /users/cursor?limit=20&q=john
// {
//   "data": [
//     { "id": "abc123", "name": "John Doe", ... }
//   ],
//   "nextCursor": "abc123"
// }
// GET /users/cursor?limit=20&cursor=abc123&q=john



router.get(
  "/:id",
  roleGuard(["admin"]),
  (req, res, next) => userController.get(req, res, next)
);

router.patch(
  "/:id",
  roleGuard(["admin"]),
  (req, res, next) => userController.adminUpdate(req, res, next)
);

router.delete(
  "/:id",
  roleGuard(["admin"]),
  (req, res, next) => userController.remove(req, res, next)
);

export default router;
