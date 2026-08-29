/*
  Warnings:

  - A unique constraint covering the columns `[systemKey]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RoleWorkspace" AS ENUM ('CUSTOMER', 'STAFF');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "systemKey" TEXT,
ADD COLUMN     "workspace" "RoleWorkspace" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StaffStoreAccess" (
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffStoreAccess_pkey" PRIMARY KEY ("userId","storeId")
);

-- CreateIndex
CREATE INDEX "StaffStoreAccess_storeId_idx" ON "StaffStoreAccess"("storeId");

-- CreateIndex
CREATE INDEX "StaffStoreAccess_userId_isPrimary_idx" ON "StaffStoreAccess"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "Role_systemKey_key" ON "Role"("systemKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "StaffStoreAccess" ADD CONSTRAINT "StaffStoreAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffStoreAccess" ADD CONSTRAINT "StaffStoreAccess_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
