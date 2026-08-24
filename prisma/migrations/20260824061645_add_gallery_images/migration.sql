-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "imageDeleteUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryImage_createdById_idx" ON "GalleryImage"("createdById");

-- CreateIndex
CREATE INDEX "GalleryImage_createdAt_idx" ON "GalleryImage"("createdAt");

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
