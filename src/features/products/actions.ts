"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { authorize, requirePermission } from "@/lib/authorize";
import { logAction } from "@/app/actions/audit";
import prisma from "@/lib/prisma";
import { createDishSchema } from "@/lib/validations/dish";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type DishResult = {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  description: string | null;
  isAvailable: boolean;
  tag: string | null;
  imageUrl: string | null;
};

type CreateDishResult = { success: true; dish: DishResult } | { error: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createDish(formData: FormData): Promise<CreateDishResult> {
  const { authorized, session } = await requirePermission("food:create");
  if (!authorized || !session?.user) {
    return { error: "You do not have permission to create dishes" };
  }

  const file = formData.get("image");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Image is required" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Image must be 5MB or less" };
  }

  const parsed = createDishSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    price: formData.get("price"),
    discountPrice: formData.get("discountPrice") ? formData.get("discountPrice") : undefined,
    description: formData.get("description") || undefined,
    isAvailable: formData.get("isAvailable") === "true" || formData.get("isAvailable") === "on",
    tag: formData.get("tag") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  const ext = file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public/uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  const imageUrl = `/uploads/${filename}`;

  let slug = data.slug?.trim() || slugify(data.name);
  const existing = await prisma.dish.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const dish = await prisma.dish.create({
    data: {
      name: data.name,
      slug,
      price: data.price,
      discountPrice: data.discountPrice,
      description: data.description,
      isAvailable: data.isAvailable,
      tag: data.tag,
      imageUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "CREATE_DISH",
    entity: "Dish",
    entityId: dish.id,
    metadata: { name: dish.name, id: dish.id },
  });

  return {
    success: true,
    dish: {
      id: dish.id,
      name: dish.name,
      slug: dish.slug,
      price: Number(dish.price),
      discountPrice: dish.discountPrice ? Number(dish.discountPrice) : null,
      description: dish.description,
      isAvailable: dish.isAvailable,
      tag: dish.tag,
      imageUrl: dish.imageUrl,
    },
  };
}

export async function getDishes() {
  const { authorized } = await authorize({ permissions: ["food:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const dishes = await prisma.dish.findMany({ orderBy: { createdAt: "desc" } });
  return {
    dishes: dishes.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      price: Number(d.price),
      discountPrice: d.discountPrice ? Number(d.discountPrice) : null,
      description: d.description,
      isAvailable: d.isAvailable,
      tag: d.tag,
      imageUrl: d.imageUrl,
    })),
  };
}
