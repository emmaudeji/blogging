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
  - `POST /api/auth/register` – create a new READER account (self-service signup).
  - `POST /api/auth/login` – login and establish a session.
  - `POST /api/auth/accept-editor-invite` – accept an editor/admin invite using a one-time token.

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

- **Editor role requests (from READER)**
  - `POST /api/editor-requests` – READER requests promotion to EDITOR (admin-reviewed).

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
  - `DELETE /api/users/:id` – admin delete user (guarded so the last admin cannot be removed).

- **Admin dashboards**
  - `GET /api/admin/stats` – aggregate stats (posts/comments/users/media).
  - `GET /api/admin/activity` – recent activity (posts, comments, media).

- **Editor invitations and requests**
  - `POST /api/admin/editor-invites` – create an invite for an EDITOR or ADMIN (one-time token).
  - `GET /api/admin/editor-invites` – list invites (filterable by `status=pending|used|expired`).
  - `GET /api/admin/editor-requests` – list READER → EDITOR requests (filterable by status).
  - `PATCH /api/admin/editor-requests/:id` – approve or reject an editor request (approval promotes the user to EDITOR).

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

## 4. Admin and Editor Lifecycle

### 4.1 Bootstrap and admin creation

- Self-registration (`POST /api/auth/register`) always creates a `READER`.
- Admins and editors are **never** created directly via public registration.
- The **first** admin is bootstrapped via a seed script:
  - `npm run seed:admin`
  - Requires env variables:
    - `ADMIN_EMAIL`
    - `ADMIN_PASSWORD`
    - `ADMIN_NAME` (optional)
  - Behaviour:
    - If an `ADMIN` already exists, it does nothing.
    - If a user with `ADMIN_EMAIL` exists, it promotes that user to `ADMIN` and resets the password.
    - Otherwise, it creates a new `ADMIN` user with the given credentials.

### 4.2 Admin-only role management

- Admins manage roles through the `/api/users` admin endpoints:
  - Promote READER → EDITOR: `PATCH /api/users/:id { "role": "EDITOR" }`.
  - Promote READER → ADMIN (additional admins): `PATCH /api/users/:id { "role": "ADMIN" }`.
  - Demote EDITOR back to READER: `PATCH /api/users/:id { "role": "READER" }`.
- Safety rules:
  - The **last** admin cannot be demoted or deleted:
    - `PATCH /api/users/:id` will reject role changes that would demote the final `ADMIN`.
    - `DELETE /api/users/:id` will reject deletion of the final `ADMIN`.

### 4.3 Editor invitation flow (admin-initiated)

1. **Admin creates invite**
   - `POST /api/admin/editor-invites`
   - Body:
     - `email` (required): invitee’s email.
     - `role` (optional): `"EDITOR"` (default) or `"ADMIN"`.
     - `expiresInDays` (optional): number of days before invite expires.
   - Backend:
     - Invalidates previous pending invites for that email.
     - Generates a unique `token` and optional `expiresAt`.
     - Stores an `EditorInvite` row: `{ email, token, role, expiresAt, usedAt: null, usedById: null }`.

2. **Frontend sends invite link**
   - The admin UI fetches invites via `GET /api/admin/editor-invites?status=pending`.
   - Frontend constructs a link for the invitee, e.g.:
     - `https://frontend.app/accept-invite?token=<token>`
   - The frontend accept-invite page will later call the API with that token.

3. **Invitee accepts invite**
   - Public endpoint: `POST /api/auth/accept-editor-invite`
   - Body:
     - `token`: the invite token from email/link.
     - `name`: display name to set for the user.
     - `password`: account password (8–72 chars).
   - Backend:
     - Validates token: checks existence, not used, not expired.
     - Ensures no user already exists with that email.
     - Creates a new `User` with:
       - `email` from invite,
       - `name` from request,
       - `password` (hashed),
       - `role` from invite (EDITOR or ADMIN).
     - Marks the invite as used (`usedAt`, `usedById`).
     - Sets `req.session.userId` to log the new user in.
   - Frontend:
     - On success, stores the session cookie and redirects to the authenticated area (e.g. editor dashboard).

4. **Admin tracking**
   - `GET /api/admin/editor-invites` returns all invites.
   - Admin UI can show counts by status (`pending`, `used`, `expired`) for notification/stats.

### 4.4 Editor request flow (reader-initiated)

1. **Reader requests editor role**
   - Authenticated endpoint: `POST /api/editor-requests`.
   - Body:
     - `note` (optional): free-text justification.
   - Backend:
     - Requires a logged-in READER.
     - If a `PENDING` request already exists for that user, returns it.
     - Otherwise, creates a new `EditorRequest` with `status = PENDING`.

2. **Admin reviews requests**
   - `GET /api/admin/editor-requests?status=PENDING` – list pending requests.
   - The frontend admin UI can present:
     - User info (fetched separately),
     - Request note,
     - Created date.

3. **Admin approves or rejects**
   - `PATCH /api/admin/editor-requests/:id`
   - Body:
     - `status`: `"APPROVED"` or `"REJECTED"`.
     - `note` (optional): explanation.
   - Backend:
     - Only ADMIN can call this.
     - Ensures request is still `PENDING`.
     - Updates the request with `status`, `note`, `decidedAt`, `decidedById`.
     - If `APPROVED`, promotes the associated user to `role = EDITOR` within a transaction.

4. **Frontend usage**
   - Reader UI:
     - Shows a "Request editor access" button which posts to `/api/editor-requests`.
     - Shows the current status of any existing request by calling an endpoint that returns user meta (or a dedicated request status route added later).
   - Admin UI:
     - Lists requests via `/api/admin/editor-requests`.
     - Provides Approve/Reject actions that PATCH each request.

---

## 5. Security Principles (Current Scope)

- **Session-based authentication** using `express-session` + Postgres-backed session store (using a dedicated `session` schema to avoid Prisma drift).
- **Session fixation protection**: session is regenerated on login and registration.
- **Role-based authorization** via `roleGuard` and role strings (`"ADMIN" | "EDITOR" | "READER"`).
- **Rate-limited auth endpoints** (`/api/auth`), to mitigate brute-force attacks.
- **Validation** using Zod for request bodies, with centralized error handling.
- **Security middleware**: Helmet (security headers), CORS (configured for the frontend), rate-limiting for sensitive routes.

---

## 6. Posts & Media

### 6.1 Data Model

**Post** (simplified):

- `id` – primary key.
- `title` / `content` / `excerpt?` – core content fields.
- `slug` – unique, URL-safe identifier generated from the title.
- `status` – `DRAFT | PUBLISHED`.
- `publishedAt?` – set when a post is published.
- `deletedAt?` – soft-delete marker; soft-deleted posts never appear in public APIs.
- `authorId` – FK to `User` (the author).
- `categoryId?` – optional FK to `Category`.
- Relations:
  - `author: User` – post author.
  - `category?: Category` – optional category.
  - `tags: Tag[]` – many-to-many via `PostTags` relation.
  - `media: Media[]` – images/PDFs/other files attached to the post.
  - `comments: Comment[]` – comments linked to the post.

**Media**:

- `id` – primary key.
- `url` – Cloudinary URL (served via CDN).
- `filename` / `mimetype` / `size` – metadata for UI and audits.
- `type` – `IMAGE | PDF | OTHER` (Prisma enum `MediaType`).
- `postId?` – optional FK to `Post` (media can be global or attached to a specific post).

We use [Cloudinary](https://cloudinary.com/) via `multer-storage-cloudinary` so uploads go directly to Cloudinary and we only store URLs + metadata in Postgres.

### 6.2 Post API Behaviour

**Public listing** – `GET /api/posts`

- Query parameters:
  - `cursor` (string, optional) – id of the last post from the previous page.
  - `limit` (number, optional) – page size (default 20, max 100).
  - `q` (string, optional) – free-text search across `title` and `content`.
- Behaviour:
  - Returns **only** posts where `status = "PUBLISHED"` and `deletedAt IS NULL`.
  - Ordered by `createdAt DESC`.
  - Includes:
    - `author` (id, name).
    - `category`.
    - `media` – at most one image (used as a cover/thumbnail).
- Response shape (conceptual):

```json
{
  "data": [
    {
      "id": "post_1",
      "title": "Hello World",
      "slug": "hello-world",
      "excerpt": "Short summary...",
      "status": "PUBLISHED",
      "publishedAt": "2025-11-22T12:34:56.000Z",
      "author": { "id": "u1", "name": "Editor One" },
      "category": { "id": "c1", "name": "Announcements" },
      "media": [
        { "id": "m1", "url": "https://res.cloudinary.com/...jpg", "type": "IMAGE" }
      ]
    }
  ],
  "nextCursor": "post_1"
}
```

The frontend uses `nextCursor` to implement "Load more" or infinite scroll.

**Public detail** – `GET /api/posts/slug/:slug`

- Public.
- Returns a **single** post if:
  - `slug` matches.
  - `status = "PUBLISHED"`.
  - `deletedAt IS NULL`.
- Includes:
  - `author` (id, name).
  - `category`.
  - `tags` (full tag objects).
  - `media` – **all** image media sorted by `createdAt ASC` (for galleries/hero images).
- Returns `404 { "message": "Not found" }` if not found or not published.

**Create post** – `POST /api/posts`

- Requires `EDITOR` or `ADMIN` (behind `authGuard` + `roleGuard`).
- Body (validated):
  - `title: string` (min length 3).
  - `content: string` (min length 10).
  - `excerpt?: string` (max length 300).
  - `status: "DRAFT" | "PUBLISHED"` (default `"DRAFT"`).
- Behaviour:
  - Generates a unique `slug` from the title.
  - Uses `req.user.id` as `authorId`.
  - Sets `publishedAt` = `now()` if status is `PUBLISHED`, else `null`.

**Update post** – `PATCH /api/posts/:id`

- Requires `EDITOR` or `ADMIN`.
- Ownership rule:
  - `ADMIN` can update any post.
  - `EDITOR` can **only** update posts where `post.authorId === req.user.id`.
- Fields are the same as create but all optional (partial update).
- If the `title` changes, a new unique `slug` is generated.
- If `status` changes to `PUBLISHED`, `publishedAt` is set to `now()` (if it wasn’t already).

**Soft delete post** – `DELETE /api/posts/:id`

- Requires `EDITOR` or `ADMIN`.
- Ownership rule same as update.
- Sets `deletedAt = now()`; data remains in the DB for auditing, but never appears in public endpoints.

### 6.3 Media API Behaviour

**Upload media** – `POST /api/media`

- Requires authentication (any logged-in user).
- Request type: `multipart/form-data`.
- Fields:
  - `file` – the file itself (handled by Multer + Cloudinary storage).
  - `postId` (optional, string) – if provided, links media to an existing, non-deleted post.
- Behaviour:
  - File is uploaded to Cloudinary under the `blog_media` folder.
  - `type` is derived from `mimetype`:
    - `image/*` → `IMAGE`.
    - `application/pdf` → `PDF`.
    - Anything else → `OTHER`.
  - If `postId` is provided, the backend verifies that the post exists and is not soft-deleted.
  - Returns the created `Media` record with Cloudinary URL.

**List media** – `GET /api/media`

- Public.
- Query params:
  - `limit` (optional, default 20).
  - `cursor` (optional, last media id).
- Returns:

```json
{
  "media": [ { "id": "m1", "url": "https://...", "type": "IMAGE", ... } ],
  "nextCursor": "m1"
}
```

**Delete media** – `DELETE /api/media/:id`

- Requires `ADMIN` or `EDITOR` and authentication.
- Currently removes the record from the DB; Cloudinary deletion can be added later as an enhancement.

### 6.4 Applying Posts & Media in the UI

**Public Home Page (feed):**

- On initial load:
  - Call `GET /api/posts?limit=20`.
  - Render each post as a card using:
    - `title`, `excerpt`, `slug`.
    - `author.name`, `publishedAt`.
    - First image in `media[0]?.url` as a cover image.
- For "Load more" or infinite scroll:
  - When the user scrolls near the bottom and `nextCursor` is non-null, call:
    - `GET /api/posts?cursor=<nextCursor>&limit=20` and append to the list.
- For search:
  - Debounce the search box to call `GET /api/posts?q=<term>&limit=20`.

**Post Detail Page:**

- Route pattern: `/posts/:slug`.
- On load:
  - Call `GET /api/posts/slug/:slug`.
  - If `404`, show a friendly "Post not found" page.
  - Else, render:
    - Title, author info, published date.
    - Hero image from `media[0]?.url` and gallery from `media`.
    - Category and tags (chips/badges) using `category` and `tags` arrays.
- Comments:
  - Call `GET /api/comments/:postId?limit=20` using `post.id` from the response.
  - Show an input form at the bottom for new comments.
  - Submitting a comment:
    - If the user is logged in (frontend knows from `/api/auth/me`): send `{ postId, content }` (and optionally `parentId` for replies) to `POST /api/comments`.
    - If the user is a guest: send `{ postId, content, guestName, guestEmail }`.
  - After submit, show a message like "Your comment is awaiting moderation"; the comment will not appear in the list until approved by an editor/admin.

**Editor Workflow (Post authoring):**

- Preconditions:
  - User is logged in and `role` from `/api/auth/me` is `"EDITOR"` or `"ADMIN"`.

- Create new post:
  1. Editor opens `/editor/posts/new`.
  2. Frontend shows a form bound to `title`, `content`, `excerpt`, `status`.
  3. On save, frontend calls `POST /api/posts` with the form data.
  4. On success, redirect to `/editor/posts/:id` or `/posts/:slug`.

- Edit existing post:
  1. Editor navigates to `/editor/posts/:id/edit`.
  2. Frontend fetches the current post (either via a dedicated internal route or by storing it from previous list/detail).
  3. On save, frontend calls `PATCH /api/posts/:id`.
  4. If the editor is not the author (and is not admin), the backend returns `403 Forbidden`.

- Attach cover image/gallery:
  1. After the post exists and the editor is on `/editor/posts/:id/edit`, show an "Upload image" button.
  2. When the user picks a file:
     - Send `multipart/form-data` to `POST /api/media` with:
       - `file` = the selected file.
       - `postId` = the current post id.
  3. On success, the UI reloads the post’s media (either re-fetch the post detail or call a dedicated media listing for that post).
  4. On the public post detail page, show `media` images as hero/gallery.

**Admin Dashboard:**

- Overall stats:
  - Call `GET /api/admin/stats` and render counts for:
    - Posts (total/draft/published),
    - Comments (pending/approved/rejected),
    - Users (admin/editor/reader),
    - Media (total/images/pdfs/other).

- Recent activity timeline:
  - Call `GET /api/admin/activity`.
  - Render a timeline mixing:
    - Recent posts (with author + category + tags),
    - Recent comments (with author/guest and linked post),
    - Recent media uploads.

- User management:
  - `GET /api/users/cursor` to power paginated user tables.
  - `PATCH /api/users/:id` to change roles (with last-admin safety enforced by backend).
  - `DELETE /api/users/:id` to remove users (again guarded against deleting the last admin).

- Editor invites:
  - Use `POST /api/admin/editor-invites` from an "Invite Editor/Admin" form.
  - Show existing invites via `GET /api/admin/editor-invites?status=pending|used|expired`.
  - Construct frontend invite URLs like `https://frontend.app/accept-invite?token=<token>` that later call `POST /api/auth/accept-editor-invite`.

- Editor requests (from readers):
  - Approve/reject via `GET /api/admin/editor-requests` + `PATCH /api/admin/editor-requests/:id`.

---

## 7. Frontend Integration – End-to-End Flows

This section ties all pieces together for a typical frontend SPA or Next.js app.

### 7.1 Authentication & Session

1. **On app bootstrap**:
   - Call `GET /api/auth/me`.
   - If `200`, store the user (id, name, role) in your global state (e.g., Redux/Zustand/React context).
   - If `401`, treat the user as anonymous.

2. **Register** (READER):
   - Form posts to `POST /api/auth/register` with `{ name, email, password }`.
   - On success, the backend creates a `READER` and initializes a session; the frontend then refreshes `me` or redirects.

3. **Login**:
   - Form posts to `POST /api/auth/login` with `{ email, password }`.
   - The backend sets the session cookie; frontend refreshes `me` and updates UI.

4. **Logout**:
   - Call `POST /api/auth/logout`, clear any client-side user state, and redirect to a public page.

### 7.2 Anonymous + Reader Experience

- Anonymous:
  - Can browse posts (`/api/posts`, `/api/posts/slug/:slug`).
  - Can submit comments as a guest to `POST /api/comments` with `guestName` and `guestEmail`.

- Reader (logged-in):
  - Same as anonymous, plus:
    - Profile page:
      - `GET /api/users/me` / `PATCH /api/users/me`.
      - `POST /api/users/me/change-password`.
    - Notifications page:
      - `GET /api/notifications?limit=...&cursor=...`.
    - Editor request:
      - Button to call `POST /api/editor-requests` to request EDITOR role.

### 7.3 Editor Experience

- Additional navigation items when `role === "EDITOR" || role === "ADMIN"`:
  - "New Post" – calls `POST /api/posts` on save.
  - "Manage Posts" – uses a listing (can re-use admin stats + filters, or add a dedicated editor-only listing later).
  - "Moderate Comments" – pages that call:
    - `GET /api/comments/:postId` to view existing comments.
    - `PATCH /api/comments/:id/moderate` to approve/reject.
  - "Media Library" – list and delete media via `/api/media` and `DELETE /api/media/:id`.

### 7.4 Admin Experience

- Includes everything above plus:
  - User management UI bound to `/api/users` endpoints.
  - Admin analytics and recent activity from `/api/admin/stats` and `/api/admin/activity`.
  - Dedicated screens for:
    - Editor invites (create + list).
    - Editor requests (review + approve/reject).

With these sections, the API surface is fully mapped to UI responsibilities: anonymous users see content and can comment; readers get accounts, notifications, and can request editor status; editors manage content, taxonomy, media, and moderation; admins oversee users, roles, and system health.
