-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "stripePriceId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "phone" TEXT;
