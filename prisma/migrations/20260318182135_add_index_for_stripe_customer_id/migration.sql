-- AlterTable
ALTER TABLE "User" ALTER COLUMN "usageLimit" SET DEFAULT 5;

-- CreateIndex
CREATE INDEX "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");
