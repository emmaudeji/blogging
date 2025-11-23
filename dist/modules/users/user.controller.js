"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("./user.service");
class UserController {
    async listCursor(req, res, next) {
        try {
            const { cursor, limit, q } = req.query;
            const result = await user_service_1.userService.findManyCursor({
                cursor: typeof cursor === "string" ? cursor : undefined,
                limit: limit ? Number(limit) : undefined,
                query: typeof q === "string" ? q : undefined,
            });
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async list(req, res, next) {
        try {
            const skip = Number(req.query.skip ?? 0);
            const take = Number(req.query.take ?? 20);
            const query = typeof req.query.q === "string" ? req.query.q : undefined;
            const { users, total } = await user_service_1.userService.findMany({ skip, take, query });
            res.json({ total, users });
        }
        catch (err) {
            next(err);
        }
    }
    async get(req, res, next) {
        try {
            const id = req.params.id;
            const user = await user_service_1.userService.findById(id);
            if (!user)
                return res.status(404).json({ message: "User not found" });
            res.json(user);
        }
        catch (err) {
            next(err);
        }
    }
    async me(req, res, next) {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ message: "Unauthorized" });
            const fresh = await user_service_1.userService.findById(user.id);
            res.json(fresh);
        }
        catch (err) {
            next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const user = req.user;
            const updated = await user_service_1.userService.updateProfile(user.id, req.body);
            res.json(updated);
        }
        catch (err) {
            next(err);
        }
    }
    async changePassword(req, res, next) {
        try {
            const user = req.user;
            const result = await user_service_1.userService.changePassword(user.id, req.body);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    // Admin actions
    async adminUpdate(req, res, next) {
        try {
            const id = req.params.id;
            const updated = await user_service_1.userService.adminUpdateUser(id, req.body);
            res.json(updated);
        }
        catch (err) {
            next(err);
        }
    }
    async remove(req, res, next) {
        try {
            const id = req.params.id;
            await user_service_1.userService.deleteUser(id);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
