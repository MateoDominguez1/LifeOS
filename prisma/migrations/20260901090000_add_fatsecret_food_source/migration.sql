-- AlterEnum
ALTER TYPE "FoodSource" ADD VALUE 'FATSECRET';

-- AlterTable
ALTER TABLE "FoodItem" ADD COLUMN "fatSecretId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FoodItem_fatSecretId_key" ON "FoodItem"("fatSecretId");
