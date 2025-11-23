"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = void 0;
/**
 * roleGuard returns middleware that ensures the authenticated user
 * has one of the allowed roles.
 */
const roleGuard = (allowed) => (req, res, next) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!allowed.includes(user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.roleGuard = roleGuard;
