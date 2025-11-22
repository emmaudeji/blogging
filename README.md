# Blogging API

Template for a production-ready blog platform backend built with **Node.js**, **Express**, and **Prisma** on **PostgreSQL**. It includes authentication, posts, comments, media uploads, taxonomy (tags & categories), notifications, and an admin dashboard.

## Tech Stack

- **Node.js** (ESM) + **TypeScript**
- **Express 5**
- **PostgreSQL** with **Prisma ORM**
- **Session-based auth** using `express-session` + `connect-pg-simple`
- **Security**: `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, `xss-clean`, `hpp`
- **Queue & Notifications**: `bullmq` + `ioredis` + `nodemailer`
- **File uploads**: `multer` (+ Cloudinary integration)
- **Logging**: `winston`

## Features (High-level)

- User registration & login with hashed passwords (`bcrypt`)
- Session-based authentication with `authGuard` and role-based access via `roleGuard`
- Roles: admin, editor, reader
- Blog posts with:
  - Slug generation & uniqueness
  - Draft/published status with `publishedAt`
  - Soft delete support
  - Cursor-based pagination & search
- Comments with moderation workflow (pending/approved/rejected) and soft delete
- Taxonomy module for categories & tags, assigning tags to posts, and querying posts by tag/category slug
- Media module for uploads and listing media assets
- Notifications module with async email sending via BullMQ + Redis
- Admin module with stats and recent activity across posts, comments, users, and media

## Project Structure

```text
blogging/
  prisma/
    schema.prisma         # Prisma schema (PostgreSQL, models, enums)
  src/
    app.ts                # Express app configuration & middlewares
    server.ts             # Server bootstrap + DB connection & graceful shutdown
    index.ts              # Entry importing app and server
    config/
      env.ts              # Zod-validated environment variables
      database.ts         # Prisma client, connect/disconnect helpers
      logger.ts           # Winston logger
      sessionStore.ts     # express-session + connect-pg-simple
      cloudinary.ts       # Cloudinary config
    middleware/
      authGuard.ts        # Require authenticated session
      roleGuard.ts        # Require specific roles
      security.middleware.ts # Reusable security helpers & global rate limiter
    routes/
      index.ts            # Mounts /auth, /users, /posts, /comments, /taxonomy, /media, /notifications, /admin
    modules/
      auth/               # Auth flows (register/login/logout/me)
      users/              # User management & profile
      posts/              # Blog posts CRUD + listing
      comments/           # Comments CRUD & moderation
      media/              # Media upload/list/delete
      taxonomy/           # Tags & categories
      notifications/      # Notification creation & listing
      admin/              # Admin dashboard stats & activity
    utils/
      email.ts            # Nodemailer transporter
      queue.ts            # BullMQ queues & workers
      pagination.ts       # Cursor pagination helpers
      slugify.ts          # Slug generation
    types/
      express.d.ts        # Express type augmentation (e.g. req.user, req.session)
```

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** database
- **Redis** instance (for BullMQ notifications)
- Optional: **Cloudinary** account for media storage

## Environment Variables

Environment is validated in `src/config/env.ts` via Zod. Create a `.env` file in the project root (there is already an example `.env` in this repo—adapt it as needed) with at least:

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your-32-char-or-longer-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP / Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Blog App <no-reply@example.com>"

# Redis
REDIS_URL=redis://localhost:6379
```

> Make sure `SESSION_SECRET` is long and random in production.

## Installation

```bash
npm install
```

This will install both runtime dependencies and dev dependencies such as TypeScript, Prisma, and ts-node.

## Database & Prisma

Prisma is configured in `prisma.config.ts` and `prisma/schema.prisma` to use PostgreSQL.

Helpful commands (also listed in `tutor.md`):

```bash
npx prisma migrate dev --name init
npx prisma generate
# optional, to inspect DB visually
npx prisma studio
# format schema
npx prisma format
```

Run the above after setting `DATABASE_URL` in `.env`.

## Running the App

Currently the only npm script defined in `package.json` is `test`, so you can run the server using `ts-node` directly:

```bash
# Development
npx ts-node src/index.ts
```

This will:

- Parse and validate environment variables (`src/config/env.ts`)
- Connect to the PostgreSQL database (`src/config/database.ts`)
- Start the Express server on `PORT` (default 4000) (`src/server.ts`)

### Suggested npm scripts (optional)

You can optionally add these to `package.json` to simplify running the project:

```json
"scripts": {
  "dev": "ts-node src/index.ts",
  "prisma:migrate": "prisma migrate dev",
  "prisma:generate": "prisma generate",
  "prisma:studio": "prisma studio",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

## API Overview

All routes are mounted under `/api` in `src/routes/index.ts`.

- `POST   /api/auth/register` – Register a new user, starts a session
- `POST   /api/auth/login` – Login and create a session
- `POST   /api/auth/logout` – Logout and destroy session
- `GET    /api/auth/me` – Get current authenticated user

- `GET    /api/posts` – List posts (supports cursor pagination, search, published filter)
- `GET    /api/posts/slug/:slug` – Get a published post by slug
- `POST   /api/posts` – Create post (auth + `admin`/`editor`)
- `PATCH  /api/posts/:id` – Update post (auth + `admin`/`editor` + ownership checks)
- `DELETE /api/posts/:id` – Soft delete post (auth + `admin`/`editor` + ownership checks)

- `POST   /api/comments` – Create comment on a post (requires authenticated user)
- `GET    /api/comments/:postId` – List approved comments for a post (cursor-based)
- `PATCH  /api/comments/:id/moderate` – Approve/reject comment (`admin`/`editor`)
- `DELETE /api/comments/:id` – Soft-delete comment (`admin`/`editor`)

- `GET    /api/taxonomy/tags/:slug/posts` – Posts by tag slug
- `GET    /api/taxonomy/categories/:slug/posts` – Posts by category slug
- `POST   /api/taxonomy/categories` – Create category (`admin`/`editor`)
- `POST   /api/taxonomy/tags` – Create tag (`admin`/`editor`)
- `POST   /api/taxonomy/posts/:postId/tags` – Assign tags to a post (`admin`/`editor`)

- `POST   /api/media` – Upload media (authenticated; multipart/form-data with `file`)
- `GET    /api/media` – List media with cursor pagination
- `DELETE /api/media/:id` – Delete media (`admin`/`editor`)

- `GET    /api/users/me` – Current user profile
- `PATCH  /api/users/me` – Update current user profile
- `POST   /api/users/me/change-password` – Change password
- `GET    /api/users` – List users (admin, offset-based pagination)
- `GET    /api/users/cursor` – List users (admin, cursor-based pagination)
- `GET    /api/users/:id` – Get user by id (admin)
- `PATCH  /api/users/:id` – Admin updates user
- `DELETE /api/users/:id` – Admin deletes user

- `GET    /api/notifications` – List notifications for current user

- `GET    /api/admin/stats` – Dashboard stats (posts, comments, users, media) – admin only
- `GET    /api/admin/activity` – Recent activity across posts/comments/media – admin only

> Endpoints above are based on the current route/controller code and may be expanded as you build out the project.

## Security & Best Practices

- Helmet, CORS, rate limiting, XSS & Mongo-style query sanitization are configured in `app.ts` and `security.middleware.ts`.
- Session cookies are `httpOnly` and `secure` in production, with `sameSite="lax"`.
- All sensitive env vars are validated on startup via Zod.
- Most write operations are protected by `authGuard` and `roleGuard`.
- Soft-delete patterns are used for posts and comments to preserve history.

## Development Notes / Next Steps

- Add proper error handling middleware for consistent API error responses.
- Flesh out the Prisma schema with all models (Post, Comment, Category, Tag, Media, Notification, etc.) and run migrations.
- Add automated tests (unit/integration) and replace the placeholder `npm test` script.
- Integrate a production-grade mail provider and logging/monitoring solution if deploying to production.

This README is generated from the current codebase and is intended as a starting point; adjust details as you evolve the project.
