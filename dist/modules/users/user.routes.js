"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/users/user.routes.ts
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const authGuard_1 = require("../../middleware/authGuard");
const roleGuard_1 = require("../../middleware/roleGuard");
const router = (0, express_1.Router)();
// Public (none) - all user endpoints are protected
router.use(authGuard_1.authGuard);
// Current user profile
router.get("/me", (req, res, next) => user_controller_1.userController.me(req, res, next));
router.patch("/me", (req, res, next) => user_controller_1.userController.updateProfile(req, res, next));
router.post("/me/change-password", (req, res, next) => user_controller_1.userController.changePassword(req, res, next));
// Admin-only routes
router.get("/", (0, roleGuard_1.roleGuard)(["ADMIN"]), (req, res, next) => user_controller_1.userController.list(req, res, next));
// | Endpoint                                    | Pagination Type   | Example                                    |
// | ------------------------------------------- | ----------------- | ------------------------------------------ |
// | `/users?skip=0&take=20&q=john`              | Offset pagination | ideal for admin UI with page numbers       |
// | `/users/cursor?cursor=<id>&limit=20&q=john` | Cursor pagination | best for infinite scrolling, huge datasets |
router.get("/cursor", (0, roleGuard_1.roleGuard)(["ADMIN"]), (req, res, next) => user_controller_1.userController.listCursor(req, res, next));
// GET /users/cursor?limit=20&q=john
// {
//   "data": [
//     { "id": "abc123", "name": "John Doe", ... }
//   ],
//   "nextCursor": "abc123"
// }
// GET /users/cursor?limit=20&cursor=abc123&q=john
router.get("/:id", (0, roleGuard_1.roleGuard)(["ADMIN"]), (req, res, next) => user_controller_1.userController.get(req, res, next));
router.patch("/:id", (0, roleGuard_1.roleGuard)(["ADMIN"]), (req, res, next) => user_controller_1.userController.adminUpdate(req, res, next));
router.delete("/:id", (0, roleGuard_1.roleGuard)(["ADMIN"]), (req, res, next) => user_controller_1.userController.remove(req, res, next));
exports.default = router;
