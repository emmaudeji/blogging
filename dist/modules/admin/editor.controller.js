"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editorController = exports.EditorController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const editorInvite_service_1 = require("./editorInvite.service");
const editorRequest_service_1 = require("./editorRequest.service");
const editor_validation_1 = require("./editor.validation");
class EditorController {
    // ADMIN: create an editor (or admin) invite
    async createInvite(req, res, next) {
        try {
            const data = editor_validation_1.createEditorInviteSchema.parse(req.body);
            const invite = await editorInvite_service_1.editorInviteService.createInvite(data);
            res.status(201).json(invite);
        }
        catch (err) {
            next(err);
        }
    }
    // ADMIN: list invites, optionally by status
    async listInvites(req, res, next) {
        try {
            const statusParam = req.query.status;
            const status = typeof statusParam === "string" &&
                ["pending", "used", "expired"].includes(statusParam)
                ? statusParam
                : undefined;
            const invites = await editorInvite_service_1.editorInviteService.listInvites({ status });
            res.json(invites);
        }
        catch (err) {
            next(err);
        }
    }
    // PUBLIC: accept invite, create new editor/admin user
    async acceptInvite(req, res, next) {
        try {
            const data = editor_validation_1.acceptEditorInviteSchema.parse(req.body);
            const hash = await bcrypt_1.default.hash(data.password, 12);
            const user = await editorInvite_service_1.editorInviteService.acceptInvite({
                token: data.token,
                name: data.name,
                passwordHash: hash,
            });
            // Issue session for the new editor/admin
            req.session.userId = user.id;
            res.status(201).json({
                message: "Invite accepted",
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
    // READER: create editor role request
    async createEditorRequest(req, res, next) {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ message: "Unauthorized" });
            const data = editor_validation_1.createEditorRequestSchema.parse(req.body);
            const request = await editorRequest_service_1.editorRequestService.createRequest(user.id, data);
            res.status(201).json(request);
        }
        catch (err) {
            next(err);
        }
    }
    // ADMIN: list editor requests
    async listEditorRequests(req, res, next) {
        try {
            const statusParam = req.query.status;
            const status = typeof statusParam === "string" &&
                ["PENDING", "APPROVED", "REJECTED"].includes(statusParam)
                ? statusParam
                : undefined;
            const requests = await editorRequest_service_1.editorRequestService.listRequests(status);
            res.json(requests);
        }
        catch (err) {
            next(err);
        }
    }
    // ADMIN: decide on editor request (approve/reject)
    async decideEditorRequest(req, res, next) {
        try {
            const admin = req.user;
            if (!admin)
                return res.status(401).json({ message: "Unauthorized" });
            const data = editor_validation_1.decideEditorRequestSchema.parse(req.body);
            const result = await editorRequest_service_1.editorRequestService.decideRequest(req.params.id, admin.id, data);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.EditorController = EditorController;
exports.editorController = new EditorController();
