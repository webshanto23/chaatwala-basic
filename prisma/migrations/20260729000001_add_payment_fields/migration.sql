ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Order" ADD COLUMN "sslTxnId" TEXT;
ALTER TABLE "Order" ADD COLUMN "sslAmount" DECIMAL(65,30);
ALTER TABLE "Order" ADD COLUMN "sslHash" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT;
CREATE UNIQUE INDEX "Order_sslTxnId_key" ON "Order"("sslTxnId");