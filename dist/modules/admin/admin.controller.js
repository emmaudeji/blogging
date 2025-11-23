"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
class AdminController {
    async stats(req, res) {
        const [posts, comments, users, media] = await Promise.all([
            admin_service_1.adminService.getPostsStats(),
            admin_service_1.adminService.getCommentsStats(),
            admin_service_1.adminService.getUsersStats(),
            admin_service_1.adminService.getMediaStats(),
        ]);
        res.json({ posts, comments, users, media });
    }
    async recentActivity(req, res) {
        const limit = Number(req.query.limit) || 10;
        const activity = await admin_service_1.adminService.getRecentActivity(limit);
        res.json(activity);
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
