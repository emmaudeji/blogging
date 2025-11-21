npx prisma migrate dev --name init
npx prisma generate
npx prisma studio   # optional, to inspect your DB visually
npx prisma format  # run to clean up schema before generating
