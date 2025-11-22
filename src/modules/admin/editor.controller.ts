// src/modules/admin/editor.controller.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { editorInviteService } from "./editorInvite.service";
import { editorRequestService } from "./editorRequest.service";
import {
  createEditorInviteSchema,
  acceptEditorInviteSchema,
  createEditorRequestSchema,
  decideEditorRequestSchema,
} from "./editor.validation";

export class EditorController {
  // ADMIN: create an editor (or admin) invite
  async createInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createEditorInviteSchema.parse(req.body);
      const invite = await editorInviteService.createInvite(data);
      res.status(201).json(invite);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: list invites, optionally by status
  async listInvites(req: Request, res: Response, next: NextFunction) {
    try {
      const statusParam = req.query.status;
      const status =
        typeof statusParam === "string" &&
        ["pending", "used", "expired"].includes(statusParam)
          ? (statusParam as "pending" | "used" | "expired")
          : undefined;

      const invites = await editorInviteService.listInvites({ status });
      res.json(invites);
    } catch (err) {
      next(err);
    }
  }

  // PUBLIC: accept invite, create new editor/admin user
  async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const data = acceptEditorInviteSchema.parse(req.body);
      const hash = await bcrypt.hash(data.password, 12);

      const user = await editorInviteService.acceptInvite({
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
    } catch (err) {
      next(err);
    }
  }

  // READER: create editor role request
  async createEditorRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const data = createEditorRequestSchema.parse(req.body);
      const request = await editorRequestService.createRequest(user.id, data);
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: list editor requests
  async listEditorRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const statusParam = req.query.status;
      const status =
        typeof statusParam === "string" &&
        ["PENDING", "APPROVED", "REJECTED"].includes(statusParam)
          ? (statusParam as "PENDING" | "APPROVED" | "REJECTED")
          : undefined;

      const requests = await editorRequestService.listRequests(status);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: decide on editor request (approve/reject)
  async decideEditorRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const admin = req.user;
      if (!admin) return res.status(401).json({ message: "Unauthorized" });

      const data = decideEditorRequestSchema.parse(req.body);
      const result = await editorRequestService.decideRequest(
        req.params.id,
        admin.id,
        data
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const editorController = new EditorController();
