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
        return user;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
