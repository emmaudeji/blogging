"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
// src/modules/auth/auth.service.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const notification_service_1 = require("../notifications/notification.service");
const notification_types_1 = require("../notifications/notification.types");
class AuthService {
    async register(data) {
        const existing = await database_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existing) {
            throw new errors_1.ConflictError("Email already in use");
        }
        const hashed = await bcrypt_1.default.hash(data.password, 12);
        const user = await database_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashed,
                role: "READER", // match Prisma Role enum value
            },
        });
        // Send a welcome notification to the new account
        await notification_service_1.notificationService.create(user.id, notification_types_1.NotificationTypes.ACCOUNT_WELCOME, "Welcome to the blog", "Your account has been created successfully.", {});
        // Notify all admins about new signup (small/blog-scale default; can be disabled later)
        const admins = await database_1.prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
        });
        await Promise.all(admins.map((admin) => notification_service_1.notificationService.create(admin.id, notification_types_1.NotificationTypes.ADMIN_NEW_USER_REGISTERED, "New user registered", `A new user has signed up with email ${user.email}.`, { userId: user.id, email: user.email })));
        return user;
    }
    async login(data) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user)
            throw new errors_1.UnauthorizedError("Invalid email or password");
        const match = await bcrypt_1.default.compare(data.password, user.password);
        if (!match)
            throw new errors_1.UnauthorizedError("Invalid email or password");
        // Notify admins about a successful login (can be throttled or disabled in larger deployments)
        const admins = await database_1.prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
        });
        await Promise.all(admins.map((admin) => notification_service_1.notificationService.create(admin.id, notification_types_1.NotificationTypes.ADMIN_USER_LOGIN, "User login", `User ${user.email} has logged in.`, { userId: user.id, email: user.email })));
        return user;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
