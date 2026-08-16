"use server";

import { unstable_cache } from "next/cache";
import { authorize, requirePermission } from "@/lib/authorize";
import { logAction } from "@/app/actions/audit";
import prisma from "@/lib/prisma";
import { createDishSchema } from "@/lib/validations/dish";
import { createDrinkSchema } from "@/lib/validations/drink";
import { createComboSchema } from "@/lib/validations/combo";
import { revalidatePath, revalidateTag } from "next/cache";
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
    await fetch(deleteUrl, { method: "DELETE", signal: AbortSignal.timeout(10000) });
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
  revalidateTag("dishes", "default");

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
  revalidateTag("dishes", "default");

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
  revalidateTag("dishes", "default");

  return { success: true };
}

export async function getDishes(filters?: { limit?: number; cursor?: string }) {
  const { authorized } = await authorize({ permissions: ["food:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const take = filters?.limit ?? 20;
  const cursor = filters?.cursor ? { id: filters.cursor } : undefined;

  const dishes = await unstable_cache(
    async () => {
      return prisma.dish.findMany({
        select: { id: true, name: true, slug: true, price: true, discountPrice: true, isAvailable: true, tag: true, imageUrl: true },
        orderBy: { createdAt: "desc" },
        take,
        ...(cursor ? { skip: 1, cursor } : {}),
      });
    },
    ["admin-dishes", String(take), filters?.cursor ?? "start"],
    { revalidate: 60, tags: ["dishes"] }
  )();

  const nextCursor = dishes.length === take ? dishes[dishes.length - 1].id : null;

  return {
    dishes: dishes.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      price: Number(d.price),
      discountPrice: d.discountPrice ? Number(d.discountPrice) : null,
      description: null,
      isAvailable: d.isAvailable,
      tag: d.tag,
      imageUrl: d.imageUrl,
      imageDeleteUrl: null,
    })),
    nextCursor,
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
  revalidateTag("drinks", "default");

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
  revalidateTag("drinks", "default");

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
  revalidateTag("drinks", "default");

  return { success: true };
}

export async function getDrinks(filters?: { limit?: number; cursor?: string }) {
  const { authorized } = await authorize({ permissions: ["food:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const take = filters?.limit ?? 20;
  const cursor = filters?.cursor ? { id: filters.cursor } : undefined;

  const drinks = await unstable_cache(
    async () => {
      return prisma.drink.findMany({
        select: { id: true, name: true, slug: true, price: true, discountPrice: true, isAvailable: true, tag: true, imageUrl: true },
        orderBy: { createdAt: "desc" },
        take,
        ...(cursor ? { skip: 1, cursor } : {}),
      });
    },
    ["admin-drinks", String(take), filters?.cursor ?? "start"],
    { revalidate: 60, tags: ["drinks"] }
  )();

  const nextCursor = drinks.length === take ? drinks[drinks.length - 1].id : null;

  return {
    drinks: drinks.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      price: Number(d.price),
      discountPrice: d.discountPrice ? Number(d.discountPrice) : null,
      description: null,
      isAvailable: d.isAvailable,
      tag: d.tag,
      imageUrl: d.imageUrl,
      imageDeleteUrl: null,
    })),
    nextCursor,
  };
}

type ComboResult = {
  id: string;
  name: string;
  slug: string;
  items: string[];
  price: number;
  originalPrice: number;
  isAvailable: boolean;
  imageUrl: string | null;
  imageDeleteUrl: string | null;
};

type CreateComboResult = { success: true; combo: ComboResult } | { error: string };

export async function createCombo(formData: FormData): Promise<CreateComboResult> {
  const { authorized, session } = await requirePermission("food:create");
  if (!authorized || !session?.user) {
    return { error: "You do not have permission to create combos" };
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

  const parsed = createComboSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    items: formData.getAll("items"),
    price: formData.get("price"),
    originalPrice: formData.get("originalPrice"),
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
  const existing = await prisma.combo.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const combo = await prisma.combo.create({
    data: {
      name: data.name,
      slug,
      items: data.items,
      price: data.price,
      originalPrice: data.originalPrice,
      isAvailable: data.isAvailable,
      imageUrl,
      imageDeleteUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "CREATE_COMBO",
    entity: "Combo",
    entityId: combo.id,
    metadata: { name: combo.name, id: combo.id },
  });

  revalidatePath("/");
  revalidatePath("/products/combos");
  revalidatePath(`/products/combos/${combo.id}`);
  revalidateTag("combos", "default");

  return {
    success: true,
    combo: {
      id: combo.id,
      name: combo.name,
      slug: combo.slug,
      items: combo.items,
      price: Number(combo.price),
      originalPrice: Number(combo.originalPrice),
      isAvailable: combo.isAvailable,
      imageUrl: combo.imageUrl,
      imageDeleteUrl: combo.imageDeleteUrl,
    },
  };
}

export async function updateCombo(id: string, formData: FormData): Promise<{ success: true; combo: ComboResult } | { error: string }> {
  const { authorized, session } = await requirePermission("food:update");
  if (!authorized || !session?.user) {
    return { error: "You do not have permission to update combos" };
  }

  const existing = await prisma.combo.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Combo not found" };
  }

  const parsed = createComboSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    items: formData.getAll("items"),
    price: formData.get("price"),
    originalPrice: formData.get("originalPrice"),
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
  const slugConflict = await prisma.combo.findUnique({ where: { slug } });
  if (slugConflict && slugConflict.id !== id) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const combo = await prisma.combo.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      items: data.items,
      price: data.price,
      originalPrice: data.originalPrice,
      isAvailable: data.isAvailable,
      imageUrl,
      imageDeleteUrl,
    },
  });

  await logAction({
    userId: session.user.id,
    action: "UPDATE_COMBO",
    entity: "Combo",
    entityId: combo.id,
    metadata: { name: combo.name, id: combo.id },
  });

  revalidatePath("/");
  revalidatePath("/products/combos");
  revalidatePath(`/products/combos/${combo.id}`);
  revalidateTag("combos", "default");

  return {
    success: true,
    combo: {
      id: combo.id,
      name: combo.name,
      slug: combo.slug,
      items: combo.items,
      price: Number(combo.price),
      originalPrice: Number(combo.originalPrice),
      isAvailable: combo.isAvailable,
      imageUrl: combo.imageUrl,
      imageDeleteUrl: combo.imageDeleteUrl,
    },
  };
}

export async function deleteCombo(id: string): Promise<{ success: true } | { error: string }> {
  const { authorized, session } = await requirePermission("food:delete");
  if (!authorized || !session?.user) {
    return { error: "You do not have permission to delete combos" };
  }

  const combo = await prisma.combo.findUnique({ where: { id } });
  if (!combo) {
    return { error: "Combo not found" };
  }

  await prisma.combo.delete({ where: { id } });

  await deleteImage(combo.imageUrl, combo.imageDeleteUrl);

  await logAction({
    userId: session.user.id,
    action: "DELETE_COMBO",
    entity: "Combo",
    entityId: id,
    metadata: { name: combo.name, id },
  });

  revalidatePath("/");
  revalidatePath("/products/combos");
  revalidatePath(`/products/combos/${id}`);
  revalidateTag("combos", "default");

  return { success: true };
}

export async function getCombos(filters?: { limit?: number; cursor?: string }) {
  const { authorized } = await authorize({ permissions: ["food:view"] });
  if (!authorized) {
    return { error: "Forbidden" };
  }

  const take = filters?.limit ?? 20;
  const cursor = filters?.cursor ? { id: filters.cursor } : undefined;

  const combos = await unstable_cache(
    async () => {
      return prisma.combo.findMany({
        select: { id: true, name: true, slug: true, price: true, originalPrice: true, isAvailable: true, imageUrl: true },
        orderBy: { createdAt: "desc" },
        take,
        ...(cursor ? { skip: 1, cursor } : {}),
      });
    },
    ["admin-combos", String(take), filters?.cursor ?? "start"],
    { revalidate: 60, tags: ["combos"] }
  )();

  const nextCursor = combos.length === take ? combos[combos.length - 1].id : null;

  return {
    combos: combos.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      price: Number(c.price),
      originalPrice: Number(c.originalPrice),
      isAvailable: c.isAvailable,
      imageUrl: c.imageUrl,
    })),
    nextCursor,
  };
}
