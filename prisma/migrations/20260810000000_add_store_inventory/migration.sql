CREATE TABLE "StoreInventory" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreInventory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoreInventory_storeId_productType_productId_key" ON "StoreInventory"("storeId", "productType", "productId");
CREATE INDEX "StoreInventory_storeId_idx" ON "StoreInventory"("storeId");
CREATE INDEX "StoreInventory_productId_idx" ON "StoreInventory"("productId");
