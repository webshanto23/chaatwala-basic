import fs from "fs/promises";
import path from "path";
import { uploadImage } from "../src/lib/image-upload";
import prisma from "../src/lib/prisma";

async function migrateFoodImages() {
  const foods = await prisma.food.findMany({ where: { imageUrl: { startsWith: "/uploads/" } } });
  console.log(`Found ${foods.length} food images to migrate.`);
  for (const food of foods) {
    if (!food.imageUrl) continue;
    try {
      const localPath = path.join(process.cwd(), "public", food.imageUrl);
      const { url, deleteUrl } = await uploadImage(await fs.readFile(localPath), { alt: food.name });
      await prisma.food.update({ where: { id: food.id }, data: { imageUrl: url, imageDeleteUrl: deleteUrl } });
      await fs.unlink(localPath);
      console.log(`Migrated: ${food.name}`);
    } catch (error) {
      console.error(`Failed: ${food.name}`, error instanceof Error ? error.message : error);
    }
  }
  await prisma.$disconnect();
}

migrateFoodImages().catch((error) => { console.error("Migration failed:", error); process.exit(1); });
