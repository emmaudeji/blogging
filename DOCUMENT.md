# Blogging API – Design Document

This is a living document that captures the **design decisions** and **security model** of the Blogging API as it evolves.

---

## 1. Roles and Identity Model

### 1.1 Identity Types

- **Anonymous visitor**
  - No login/session.
  - Can read all public content (posts, comments, taxonomy, media list).
  - Can submit comments as a guest (subject to moderation).

- **READER** (logged-in subscriber)
  - Has an account and authenticated session.
  - Everything an anonymous visitor can do, plus:
    - Manage own profile (`/api/users/me`, `/api/users/me` PATCH, change password).
    - Receive and read notifications.
    - Comment as an authenticated user (comments still moderated by editors/admins).

- **EDITOR** (author)
  - Everything a READER can do, plus:
    - Create, update, and soft-delete posts.
    - Manage taxonomy (tags/categories) and assign tags to posts.
    - Moderate comments (approve/reject, soft-delete).

- **ADMIN**
  - Full control over the system.
  - Everything an EDITOR can do, plus:
    - User management (list, view, update, delete users).
    - Access to admin dashboards and activity feeds.

Roles are modelled via the Prisma enum `Role { ADMIN, EDITOR, READER }` and enforced in middleware (`authGuard`, `roleGuard`).

---

## 2. Access Control Overview

This section summarizes which routes are public vs protected.

### 2.1 Public (no authentication required)

- **Posts**
  - `GET /api/posts` – list posts (with filters/pagination).
  - `GET /api/posts/slug/:slug` – get a single published post by slug.

- **Taxonomy**
  - `GET /api/taxonomy/tags/:slug/posts` – posts by tag slug.
  - `GET /api/taxonomy/categories/:slug/posts` – posts by category slug.

- **Comments**
  - `GET /api/comments/:postId` – list **approved** comments for a post.
  - `POST /api/comments` – create a comment as **guest or authenticated user**.

- **Media**
  - `GET /api/media` – list media items.

- **Authentication**
  - `POST /api/auth/register` – create a new account.
  - `POST /api/auth/login` – login and establish a session.

> Note: `POST /api/comments` is public but implemented with strong validation + moderation to remain production-safe.

### 2.2 Authenticated (any logged-in user: READER/EDITOR/ADMIN)

- **Auth/session**
  - `POST /api/auth/logout` – destroy session and clear cookie.
  - `GET /api/auth/me` – get logged-in user info.

- **Profile**
  - `GET /api/users/me` – current user profile.
  - `PATCH /api/users/me` – update own profile.
  - `POST /api/users/me/change-password` – change own password.

- **Notifications**
  - `GET /api/notifications` – list notifications for the current user.

### 2.3 EDITOR/ADMIN-only

- **Posts**
  - `POST /api/posts` – create post.
  - `PATCH /api/posts/:id` – update post.
  - `DELETE /api/posts/:id` – soft delete post.

- **Comments moderation**
  - `PATCH /api/comments/:id/moderate` – approve/reject comment.
  - `DELETE /api/comments/:id` – soft delete comment (admin/editor, subject to future author-ownership rules).

- **Taxonomy**
  - `POST /api/taxonomy/categories` – create category.
  - `POST /api/taxonomy/tags` – create tag.
  - `POST /api/taxonomy/posts/:postId/tags` – assign tags to a post.

- **Media**
  - `DELETE /api/media/:id` – delete media.

### 2.4 ADMIN-only

- **Users**
  - `GET /api/users` – list users (offset pagination).
  - `GET /api/users/cursor` – list users (cursor pagination).
  - `GET /api/users/:id` – get user by id.
  - `PATCH /api/users/:id` – admin update user (including role changes).
  - `DELETE /api/users/:id` – admin delete user.

- **Admin dashboards**
  - `GET /api/admin/stats` – aggregate stats (posts/comments/users/media).
  - `GET /api/admin/activity` – recent activity (posts, comments, media).

All protected routes use `authGuard` to ensure a session exists, and `roleGuard([...])` where role-based authorization is required.

---

## 3. Commenting Model and Policy

### 3.1 High-level goals

- Allow **any visitor** to comment on posts (anonymous comments permitted).
- Strong validation of comment input (length, required fields).
- **Moderation-first**: comments default to `PENDING` and are not visible publicly until approved by an EDITOR/ADMIN.
- Support both **guest comments** and **authenticated comments**:
  - Guest: identified by `guestName` + `guestEmail`.
  - Authenticated: linked to a `User` via `authorId`.

### 3.2 Data Model (Prisma)

Comments are stored with a flexible schema to support both guests and logged-in users.

- `Comment` core fields:
  - `id`: primary key.
  - `postId`: identifier of the post the comment belongs to.
  - `parentId` (optional): parent comment id for threads.
  - `content`: the comment text.
  - `authorId` (optional): FK to `User` when posted by logged-in user.
  - `guestName` / `guestEmail` (optional): for anonymous guest comments.
  - `status`: `PENDING` | `APPROVED` | `REJECTED`.
  - `createdAt` / `deletedAt`: timestamps; soft-delete uses `deletedAt`.

- Moderation workflow:
  - New comments are created with `status = PENDING`.
  - Public listing (`GET /api/comments/:postId`) only shows status `APPROVED` and `deletedAt = null`.
  - Editors/admins can:
    - Approve or reject: `PATCH /api/comments/:id/moderate`.
    - Soft delete: `DELETE /api/comments/:id` (content replaced with `"[deleted]"`, `deletedAt` set).

### 3.3 API Behaviour

- **Create comment** – `POST /api/comments`
  - **Public** endpoint; no authentication required.
  - Request body (simplified):
    - `postId` (string, required): id of the post.
    - `parentId` (string, optional): parent comment id for threaded replies.
    - `content` (string, required): 3–2500 characters.
    - For guests (not logged in):
      - `guestName` (string, required for guests).
      - `guestEmail` (string, email, required for guests).
    - For authenticated users:
      - `guestName`/`guestEmail` are ignored; backend uses `req.user.id` as `authorId`.
  - Result:
    - Returns `201` with the created comment (status `PENDING`).
    - Comment will not show up in the public list until approved.

- **List comments for a post** – `GET /api/comments/:postId`
  - Public.
  - Returns only APPROVED, non-deleted comments with pagination via cursor.

- **Moderate comment** – `PATCH /api/comments/:id/moderate`
  - Requires authentication + `EDITOR` or `ADMIN`.
  - Body: `{ "status": "APPROVED" | "REJECTED" }`.

- **Soft delete comment** – `DELETE /api/comments/:id`
  - Requires authentication + `EDITOR` or `ADMIN` (for now).
  - Replaces `content` with `"[deleted]"` and sets `deletedAt` timestamp.

---

## 4. Security Principles (Current Scope)

- **Session-based authentication** using `express-session` + Postgres-backed session store.
- **Session fixation protection**: session is regenerated on login and registration.
- **Role-based authorization** via `roleGuard` and Prisma `Role` enum.
- **Rate-limited auth endpoints** (`/api/auth`), to mitigate brute-force attacks.
- **Validation** using Zod for request bodies, with centralized error handling.
- **Sanitization and security middleware**: helmet, CORS, xss-clean, express-mongo-sanitize, etc.

This document will be updated as we refine models (Posts, Taxonomy, Media, Notifications) and add more detailed policies and flows.
