/*
  Warnings:

  - A unique constraint covering the columns `[publicSlug]` on the table `Resume` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "hideContactInfo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentResumeId" VARCHAR(36),
ADD COLUMN     "publicSlug" VARCHAR(20),
ADD COLUMN     "tailoredFor" VARCHAR(200),
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProfilePreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "fullName" TEXT,
    "headline" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "links" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfilePreset_userId_idx" ON "ProfilePreset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Resume_publicSlug_key" ON "Resume"("publicSlug");

-- CreateIndex
CREATE INDEX "Resume_userId_parentResumeId_idx" ON "Resume"("userId", "parentResumeId");

-- CreateIndex
CREATE INDEX "Resume_parentResumeId_idx" ON "Resume"("parentResumeId");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_parentResumeId_fkey" FOREIGN KEY ("parentResumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePreset" ADD CONSTRAINT "ProfilePreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
