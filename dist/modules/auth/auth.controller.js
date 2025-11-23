"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_validation_1 = require("./auth.validation");
const logger_1 = require("../../config/logger");
function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
}
class AuthController {
    async register(req, res, next) {
        try {
            logger_1.logger.debug("[auth.register] raw body", req.body);
            const data = auth_validation_1.registerSchema.parse(req.body);
            const user = await auth_service_1.authService.register(data);
            // Prevent session fixation: issue a fresh session ID on login/registration
            await regenerateSession(req);
            req.session.userId = user.id;
            res.status(201).json({
                message: "Registration successful",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    async login(req, res, next) {
        try {
            logger_1.logger.debug("[auth.login] raw body", req.body);
            const data = auth_validation_1.loginSchema.parse(req.body);
            const user = await auth_service_1.authService.login(data);
            await regenerateSession(req);
            req.session.userId = user.id;
            res.json({
                message: "Login successful",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    async logout(req, res, next) {
        try {
            req.session.destroy((err) => {
                if (err)
                    return next(err);
                res.clearCookie("connect.sid");
                res.json({ message: "Logged out" });
            });
        }
        catch (err) {
            next(err);
        }
    }
    async me(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        res.json({
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
        });
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
