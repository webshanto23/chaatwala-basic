-- Add storeId to Dish
ALTER TABLE "Dish" ADD COLUMN "storeId" TEXT;

-- Add storeId to Drink
ALTER TABLE "Drink" ADD COLUMN "storeId" TEXT;

-- Add storeId to Combo
ALTER TABLE "Combo" ADD COLUMN "storeId" TEXT;

-- Create foreign keys
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Drink" ADD CONSTRAINT "Drink_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Recreate indexes
CREATE INDEX "Dish_storeId_idx" ON "Dish"("storeId");
CREATE INDEX "Drink_storeId_idx" ON "Drink"("storeId");
CREATE INDEX "Combo_storeId_idx" ON "Combo"("storeId");
