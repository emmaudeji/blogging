npx prisma migrate dev --name init
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
