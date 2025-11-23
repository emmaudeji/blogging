"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGuard = authGuard;
const database_1 = require("../config/database");
async function authGuard(req, res, next) {
    try {
        const userId = req.session.userId;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        req.user = user; // typed via declaration merge
        next();
    }
    catch (err) {
        next(err);
    }
}
