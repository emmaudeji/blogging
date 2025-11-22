-- CreateEnum
CREATE TYPE "EditorRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "EditorInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,

    CONSTRAINT "EditorInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EditorRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "note" TEXT,

    CONSTRAINT "EditorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditorInvite_email_key" ON "EditorInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EditorInvite_token_key" ON "EditorInvite"("token");
