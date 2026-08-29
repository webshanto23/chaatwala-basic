-- CreateEnum
CREATE TYPE "FoodKind" AS ENUM ('STANDARD', 'COMBO');

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "FoodKind" NOT NULL DEFAULT 'STANDARD',
    "basePrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "imageDeleteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodCategoryAssignment" (
    "foodId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "FoodCategoryAssignment_pkey" PRIMARY KEY ("foodId","categoryId")
);

-- CreateTable
CREATE TABLE "FoodTagAssignment" (
    "foodId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "FoodTagAssignment_pkey" PRIMARY KEY ("foodId","tagId")
);

-- CreateTable
CREATE TABLE "FoodBundleItem" (
    "bundleFoodId" TEXT NOT NULL,
    "componentFoodId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FoodBundleItem_pkey" PRIMARY KEY ("bundleFoodId","componentFoodId")
);

-- CreateTable
CREATE TABLE "FoodStoreAvailability" (
    "foodId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodStoreAvailability_pkey" PRIMARY KEY ("foodId","storeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Food_slug_key" ON "Food"("slug");

-- CreateIndex
CREATE INDEX "Food_kind_isAvailable_idx" ON "Food"("kind", "isAvailable");

-- CreateIndex
CREATE INDEX "Food_createdAt_idx" ON "Food"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FoodCategory_name_key" ON "FoodCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FoodCategory_slug_key" ON "FoodCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FoodTag_name_key" ON "FoodTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FoodTag_slug_key" ON "FoodTag"("slug");

-- CreateIndex
CREATE INDEX "FoodCategoryAssignment_categoryId_foodId_idx" ON "FoodCategoryAssignment"("categoryId", "foodId");

-- CreateIndex
CREATE INDEX "FoodTagAssignment_tagId_foodId_idx" ON "FoodTagAssignment"("tagId", "foodId");

-- CreateIndex
CREATE INDEX "FoodBundleItem_componentFoodId_idx" ON "FoodBundleItem"("componentFoodId");

-- CreateIndex
CREATE INDEX "FoodStoreAvailability_storeId_foodId_idx" ON "FoodStoreAvailability"("storeId", "foodId");

-- AddForeignKey
ALTER TABLE "FoodCategoryAssignment" ADD CONSTRAINT "FoodCategoryAssignment_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodCategoryAssignment" ADD CONSTRAINT "FoodCategoryAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FoodCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodTagAssignment" ADD CONSTRAINT "FoodTagAssignment_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodTagAssignment" ADD CONSTRAINT "FoodTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "FoodTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodBundleItem" ADD CONSTRAINT "FoodBundleItem_bundleFoodId_fkey" FOREIGN KEY ("bundleFoodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodBundleItem" ADD CONSTRAINT "FoodBundleItem_componentFoodId_fkey" FOREIGN KEY ("componentFoodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodStoreAvailability" ADD CONSTRAINT "FoodStoreAvailability_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodStoreAvailability" ADD CONSTRAINT "FoodStoreAvailability_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
