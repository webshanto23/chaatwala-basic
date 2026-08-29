/*
  Warnings:

  - You are about to drop the `Combo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Dish` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Drink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StoreInventory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Combo" DROP CONSTRAINT "Combo_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Dish" DROP CONSTRAINT "Dish_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Drink" DROP CONSTRAINT "Drink_storeId_fkey";

-- DropTable
DROP TABLE "Combo";

-- DropTable
DROP TABLE "Dish";

-- DropTable
DROP TABLE "Drink";

-- DropTable
DROP TABLE "StoreInventory";
