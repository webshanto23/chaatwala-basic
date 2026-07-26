import prisma from "../src/lib/prisma";
import { uploadImage } from "../src/lib/image-upload";
import fs from "fs/promises";
import path from "path";

async function migrateProductImages() {
  console.log("Starting image migration to ImageBB...\n");

  const [dishes, drinks, combos] = await Promise.all([
    prisma.dish.findMany({ where: { imageUrl: { startsWith: "/uploads/" } } }),
    prisma.drink.findMany({ where: { imageUrl: { startsWith: "/uploads/" } } }),
    prisma.combo.findMany({ where: { imageUrl: { startsWith: "/uploads/" } } }),
  ]);

  const validDishes = dishes.filter((d): d is typeof d & { imageUrl: string } => Boolean(d.imageUrl));
  const validDrinks = drinks.filter((d): d is typeof d & { imageUrl: string } => Boolean(d.imageUrl));
  const validCombos = combos.filter((d): d is typeof d & { imageUrl: string } => Boolean(d.imageUrl));

  const total = dishes.length + drinks.length + combos.length;
  console.log(`Found ${total} images to migrate (${dishes.length} dishes, ${drinks.length} drinks, ${combos.length} combos)\n`);

  if (total === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  let migrated = 0;
  let failed = 0;

  for (const dish of validDishes) {
    try {
      const localPath = path.join(process.cwd(), "public", dish.imageUrl);
      const fileBuffer = await fs.readFile(localPath);
      const { url, deleteUrl } = await uploadImage(fileBuffer, { alt: dish.name });

      await prisma.dish.update({
        where: { id: dish.id },
        data: { imageUrl: url, imageDeleteUrl: deleteUrl },
      });

      await fs.unlink(localPath);
      migrated++;
      console.log(`✅ Dish: ${dish.name}`);
    } catch (error) {
      failed++;
      console.error(`❌ Dish: ${dish.name} -`, error instanceof Error ? error.message : error);
    }
  }

  for (const drink of validDrinks) {
    try {
      const localPath = path.join(process.cwd(), "public", drink.imageUrl);
      const fileBuffer = await fs.readFile(localPath);
      const { url, deleteUrl } = await uploadImage(fileBuffer, { alt: drink.name });

      await prisma.drink.update({
        where: { id: drink.id },
        data: { imageUrl: url, imageDeleteUrl: deleteUrl },
      });

      await fs.unlink(localPath);
      migrated++;
      console.log(`✅ Drink: ${drink.name}`);
    } catch (error) {
      failed++;
      console.error(`❌ Drink: ${drink.name} -`, error instanceof Error ? error.message : error);
    }
  }

  for (const combo of validCombos) {
    try {
      const localPath = path.join(process.cwd(), "public", combo.imageUrl);
      const fileBuffer = await fs.readFile(localPath);
      const { url, deleteUrl } = await uploadImage(fileBuffer, { alt: combo.name });

      await prisma.combo.update({
        where: { id: combo.id },
        data: { imageUrl: url, imageDeleteUrl: deleteUrl },
      });

      await fs.unlink(localPath);
      migrated++;
      console.log(`✅ Combo: ${combo.name}`);
    } catch (error) {
      failed++;
      console.error(`❌ Combo: ${combo.name} -`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\nMigration complete: ${migrated} succeeded, ${failed} failed out of ${total}`);
  await prisma.$disconnect();
}

migrateProductImages().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
