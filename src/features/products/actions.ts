"use server";

import { authorize, requirePermission } from "@/lib/authorize";
import { logAction } from "@/app/actions/audit";
import prisma from "@/lib/prisma";
import { createDishSchema } from "@/lib/validations/dish";
import { createDrinkSchema } from "@/lib/validations/drink";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { uploadImage } from "@/lib/image-upload";

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
  imageDeleteUrl: string | null;
};

type CreateDishResult = { success: true; dish: DishResult } | { error: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function deleteImage(url: string | null, deleteUrl: string | null) {
  if (!deleteUrl) return;
  try {
    await fetch(deleteUrl, { method: "DELETE" });
  } catch {
    // ignore cleanup errors
  }
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
  const { url: imageUrl, deleteUrl: imageDeleteUrl } = await uploadImage(file, {
    alt: data.name,
  });

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
      imageDeleteUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "CREATE_DISH",
    entity: "Dish",
    entityId: dish.id,
    metadata: { name: dish.name, id: dish.id },
  });

  revalidatePath("/");
  revalidatePath("/products/dishes");
  revalidatePath(`/products/dishes/${dish.id}`);

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
      imageDeleteUrl: dish.imageDeleteUrl,
    },
  };
}

export async function updateDish(id: string, formData: FormData): Promise<{ success: true; dish: DishResult } | { error: string }> {
  const { authorized, session } = await requirePermission("food:update");
  if (!authorized || !session?.user) {
    return { error: "You do not have permission to update dishes" };
  }

  const existing = await prisma.dish.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Dish not found" };
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
  const file = formData.get("image");
  let imageUrl = existing.imageUrl;
  let imageDeleteUrl = existing.imageDeleteUrl;

  if (file && file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: "Image must be 5MB or less" };
    }

    const { url: newImageUrl, deleteUrl: newDeleteUrl } = await uploadImage(file, {
      alt: data.name,
    });
    imageUrl = newImageUrl;
    imageDeleteUrl = newDeleteUrl ?? null;

    if (existing.imageDeleteUrl) {
      await deleteImage(existing.imageUrl, existing.imageDeleteUrl);
    }
  }

  let slug = data.slug?.trim() || slugify(data.name);
  const slugConflict = await prisma.dish.findUnique({ where: { slug } });
  if (slugConflict && slugConflict.id !== id) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const dish = await prisma.dish.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      price: data.price,
      discountPrice: data.discountPrice,
      description: data.description,
      isAvailable: data.isAvailable,
      tag: data.tag,
      imageUrl,
      imageDeleteUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "UPDATE_DISH",
    entity: "Dish",
    entityId: dish.id,
    metadata: { name: dish.name, id: dish.id },
  });

  revalidatePath("/");
  revalidatePath("/products/dishes");
  revalidatePath(`/products/dishes/${dish.id}`);

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
      imageDeleteUrl: dish.imageDeleteUrl,
    },
  };
}

export async function deleteDish(id: string): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requirePermission("food:delete");
  if (!authorized || !session?.user) {
    return { error: "You do not have permission to delete dishes" };
  }

  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish) {
    return { error: "Dish not found" };
  }

  await prisma.dish.delete({ where: { id } });

  await deleteImage(dish.imageUrl, dish.imageDeleteUrl);

  await logAction({
    userId: session.user.id,
    action: "DELETE_DISH",
    entity: "Dish",
    entityId: id,
    metadata: { name: dish.name, id },
  });

  revalidatePath("/");
  revalidatePath("/products/dishes");
  revalidatePath(`/products/dishes/${id}`);

  return { success: true };
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
      imageDeleteUrl: d.imageDeleteUrl,
    })),
  };
}

type DrinkResult = {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  description: string | null;
  isAvailable: boolean;
  tag: string | null;
  imageUrl: string | null;
  imageDeleteUrl: string | null;
};

type CreateDrinkResult = { success: true; drink: DrinkResult } | { error: string };

export async function createDrink(formData: FormData): Promise<CreateDrinkResult> {
  const { authorized, session } = await requirePermission("food:create");
  if (!authorized || !session?.user) {
    return { error: "You do not have permission to create drinks" };
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

  const parsed = createDrinkSchema.safeParse({
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
  const { url: imageUrl, deleteUrl: imageDeleteUrl } = await uploadImage(file, {
    alt: data.name,
  });

  let slug = data.slug?.trim() || slugify(data.name);
  const existing = await prisma.drink.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const drink = await prisma.drink.create({
    data: {
      name: data.name,
      slug,
      price: data.price,
      discountPrice: data.discountPrice,
      description: data.description,
      isAvailable: data.isAvailable,
      tag: data.tag,
      imageUrl,
      imageDeleteUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "CREATE_DRINK",
    entity: "Drink",
    entityId: drink.id,
    metadata: { name: drink.name, id: drink.id },
  });

  revalidatePath("/");
  revalidatePath("/products/drinks");
  revalidatePath(`/products/drinks/${drink.id}`);

  return {
    success: true,
    drink: {
      id: drink.id,
      name: drink.name,
      slug: drink.slug,
      price: Number(drink.price),
      discountPrice: drink.discountPrice ? Number(drink.discountPrice) : null,
      description: drink.description,
      isAvailable: drink.isAvailable,
      tag: drink.tag,
      imageUrl: drink.imageUrl,
      imageDeleteUrl: drink.imageDeleteUrl,
    },
  };
}

export async function updateDrink(id: string, formData: FormData): Promise<{ success: true; drink: DrinkResult } | { error: string }> {
  const { authorized, session } = await requirePermission("food:update");
  if (!authorized || !session?.user) {
    return { error: "You do not have permission to update drinks" };
  }

  const existing = await prisma.drink.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Drink not found" };
  }

  const parsed = createDrinkSchema.safeParse({
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
  const file = formData.get("image");
  let imageUrl = existing.imageUrl;
  let imageDeleteUrl = existing.imageDeleteUrl;

  if (file && file instanceof File && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { error: "Image must be 5MB or less" };
    }

    const { url: newImageUrl, deleteUrl: newDeleteUrl } = await uploadImage(file, {
      alt: data.name,
    });
    imageUrl = newImageUrl;
    imageDeleteUrl = newDeleteUrl ?? null;

    if (existing.imageDeleteUrl) {
      await deleteImage(existing.imageUrl, existing.imageDeleteUrl);
    }
  }

  let slug = data.slug?.trim() || slugify(data.name);
  const slugConflict = await prisma.drink.findUnique({ where: { slug } });
  if (slugConflict && slugConflict.id !== id) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const drink = await prisma.drink.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      price: data.price,
      discountPrice: data.discountPrice,
      description: data.description,
      isAvailable: data.isAvailable,
      tag: data.tag,
      imageUrl,
      imageDeleteUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "UPDATE_DRINK",
    entity: "Drink",
    entityId: drink.id,
    metadata: { name: drink.name, id: drink.id },
  });

  revalidatePath("/");
  revalidatePath("/products/drinks");
  revalidatePath(`/products/drinks/${drink.id}`);

  return {
    success: true,
    drink: {
      id: drink.id,
      name: drink.name,
      slug: drink.slug,
      price: Number(drink.price),
      discountPrice: drink.discountPrice ? Number(drink.discountPrice) : null,
      description: drink.description,
      isAvailable: drink.isAvailable,
      tag: drink.tag,
      imageUrl: drink.imageUrl,
      imageDeleteUrl: drink.imageDeleteUrl,
    },
  };
}

export async function deleteDrink(id: string): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requirePermission("food:delete");
  if (!authorized || !session?.user) {
    return { error: "You do not have permission to delete drinks" };
  }

  const drink = await prisma.drink.findUnique({ where: { id } });
  if (!drink) {
    return { error: "Drink not found" };
  }

  await prisma.drink.delete({ where: { id } });

  await deleteImage(drink.imageUrl, drink.imageDeleteUrl);

  await logAction({
    userId: session.user.id,
    action: "DELETE_DRINK",
    entity: "Drink",
    entityId: id,
    metadata: { name: drink.name, id },
  });

  revalidatePath("/");
  revalidatePath("/products/drinks");
  revalidatePath(`/products/drinks/${id}`);

  return { success: true };
}

export async function getDrinks() {
  const { authorized } = await authorize({ permissions: ["food:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const drinks = await prisma.drink.findMany({ orderBy: { createdAt: "desc" } });
  return {
    drinks: drinks.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      price: Number(d.price),
      discountPrice: d.discountPrice ? Number(d.discountPrice) : null,
      description: d.description,
      isAvailable: d.isAvailable,
      tag: d.tag,
      imageUrl: d.imageUrl,
      imageDeleteUrl: d.imageDeleteUrl,
    })),
  };
}
