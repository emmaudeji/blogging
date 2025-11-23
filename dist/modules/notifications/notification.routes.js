"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const authGuard_1 = require("../../middleware/authGuard");
const router = (0, express_1.Router)();
// Authenticated users can list their notifications
router.get("/", authGuard_1.authGuard, notification_controller_1.notificationController.list);
exports.default = router;
