npx prisma migrate dev --name new-model
npx prisma generate
npx prisma studio   # optional, to inspect your DB visually
npx prisma format  # run to clean up schema before generating


<!-- Prima -->
 
# install required packages
npm install prisma --save-dev
npm install @prisma/client

# (optional) TypeScript + ts-node for running examples
npm install typescript ts-node @types/node --save-dev
npx tsc --init

npx prisma migrate dev

Used in production.
npx prisma migrate deploy



test user
{"message":"Registration successful","user":{"id":"cmiailrgo0000wkhoe3cakv2c","name":"Jane Doe","email":"jane@example.com","role":"READER"}}
{
  "email": "jane@example.com",
  "password": "StrongPass123"
}

{"id":"cmiar58hs0000wkj8h4rfqxat","email":"editor.invited@example.com","token":"536a3bb1-518c-4b5b-9119-ab08c50a0f0f","role":"EDITOR","createdAt":"2025-11-22T20:39:07.841Z","expiresAt":"2025-11-29T20:39:07.838Z","usedAt":null,"usedById":null}







GET /api/admin/activity 500 44.695 ms - 1133
prisma:query SELECT 1
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email", "public"."User"."password", "public"."User"."role"::text, "public"."User"."bio", "public"."User"."avatarUrl", "public"."User"."createdAt", "public"."User"."updatedAt" FROM "public"."User" WHERE ("public"."User"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
error: Unhandled error Cannot read properties of undefined (reading 'count') {"stack":"TypeError: Cannot read properties of undefined (reading 'count')\n    at AdminService.getPostsStats (C:\\Users\\HP\\code\\blogging\\src\\modules\\admin\\admin.service.ts:6:37)\n    at stats (C:\\Users\\HP\\code\\blogging\\src\\modules\\admin\\admin.controller.ts:7:20)\n    at Layer.handleRequest (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\lib\\layer.js:152:17)\n   
 at next (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\lib\\layer.js:152:17)\n    at C:\\Users\\HP\\code\\blogging\\node_modules\\router\\index.js:295:15\n    at processParams (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\index.js:582:12)\n    at next (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\index.js:291:5)","timestamp":"2025-11-22T19:22:43.639Z"}
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."User"."id" FROM "public"."User" WHERE 1=1 OFFSET $1) AS "sub"
GET /api/admin/stats 500 32.355 ms - 1112
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."User"."id" FROM "public"."User" WHERE "public"."User"."role" = CAST($1::text AS "public"."Role") OFFSET $2) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."User"."id" FROM "public"."User" WHERE "public"."User"."role" = CAST($1::text AS "public"."Role") OFFSET $2) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."User"."id" FROM "public"."User" WHERE "public"."User"."role" = CAST($1::text AS "public"."Role") OFFSET $2) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Comment"."id" FROM "public"."Comment" WHERE 1=1 OFFSET $1) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Comment"."id" FROM "public"."Comment" WHERE "public"."Comment"."status" = CAST($1::text AS "public"."CommentStatus") OFFSET $2) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Comment"."id" FROM "public"."Comment" WHERE "public"."Comment"."status" = CAST($1::text AS "public"."CommentStatus") OFFSET $2) AS "sub"
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Comment"."id" FROM "public"."Comment" WHERE "public"."Comment"."status" = CAST($1::text AS "public"."CommentStatus") OFFSET $2) AS "sub"




prisma:query SELECT 1
prisma:query SELECT "public"."User"."id", "public"."User"."name", "public"."User"."email", "public"."User"."password", "public"."User"."role"::text, "public"."User"."bio", "public"."User"."avatarUrl", "public"."User"."createdAt", "public"."User"."updatedAt" FROM "public"."User" WHERE ("public"."User"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
error: Unhandled error Cannot read properties of undefined (reading 'findMany') {"stack":"TypeError: Cannot read properties of undefined (reading 'findMany')\n    at AdminService.getRecentActivity (C:\\Users\\HP\\code\\blogging\\src\\modules\\admin\\admin.service.ts:45:37)\n    at recentActivity (C:\\Users\\HP\\code\\blogging\\src\\modules\\admin\\admin.controller.ts:18:41)\n    at Layer.handleRequest (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\lib\\layer.js:152:17)\n    at C:\\Users\\HP\\code\\blogging\\node_modules\\router\\index.js:295:15\n    at processParams (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\index.js:582:12)\n    at next (C:\\Users\\HP\\code\\blogging\\node_modules\\router\\index.js:291:5)","timestamp":"2025-11-22T19:24:12.187Z"}
GET /api/admin/activity 500 26.663 ms - 1133