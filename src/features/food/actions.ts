"use server";

import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { logAction } from "@/app/actions/audit";
import { requirePermission } from "@/lib/authorize";
import { uploadImage } from "@/lib/image-upload";
import prisma from "@/lib/prisma";
import { comboFoodSchema, standardFoodSchema } from "@/lib/validations/food";
import { getFoodCatalog, getFoodTaxonomy } from "./queries";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const taxonomyNameSchema = z.string().trim().min(2).max(60);
const cuidSchema = z.string().cuid();

export type FoodResult = {
  id: string;
  name: string;
  slug: string;
  kind: "STANDARD" | "COMBO";
  basePrice: number;
  discountPercent: number;
  description: string | null;
  isAvailable: boolean;
  imageUrl: string | null;
  categoryIds: string[];
  tagIds: string[];
  componentFoodIds: string[];
};

function parseIdList(value: FormDataEntryValue | null): string[] | null {
  try {
    const parsed: unknown = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string") ? parsed : null;
  } catch {
    return null;
  }
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(name: string, requested?: string, excludingId?: string) {
  const candidate = requested?.trim() || slugify(name);
  const existing = await prisma.food.findUnique({ where: { slug: candidate }, select: { id: true } });
  return !existing || existing.id === excludingId ? candidate : `${candidate}-${randomUUID().slice(0, 6)}`;
}

async function requireStaffPermission(permission: string) {
  const access = await requirePermission(permission);
  if (!access.authorized || !access.session?.user || access.session.user.workspace !== "staff") return null;
  return access.session.user;
}

async function verifyTaxonomy(categoryIds: string[], tagIds: string[]) {
  const uniqueCategoryIds = [...new Set(categoryIds)];
  const uniqueTagIds = [...new Set(tagIds)];
  const [categories, tags] = await Promise.all([
    prisma.foodCategory.count({ where: { id: { in: uniqueCategoryIds } } }),
    prisma.foodTag.count({ where: { id: { in: uniqueTagIds } } }),
  ]);
  return categories === uniqueCategoryIds.length && tags === uniqueTagIds.length;
}

function refreshFoodCatalog() {
  revalidateTag("foods", "default");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/staff/catalog/foods");
}

function validateImage(file: FormDataEntryValue | null): { file: File | null; error?: never } | { file?: never; error: string } {
  if (!(file instanceof File) || file.size === 0) return { file: null };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { error: "Only JPG, PNG, WEBP, or GIF images are allowed" };
  if (file.size > MAX_FILE_SIZE) return { error: "Image must be 5MB or less" };
  return { file };
}

async function deleteStoredImage(deleteUrl: string | null | undefined) {
  if (!deleteUrl) return;
  try {
    await fetch(deleteUrl, { method: "DELETE", signal: AbortSignal.timeout(10_000) });
  } catch {
    // A failed provider cleanup must not make a completed database mutation fail.
  }
}

function serializeFood(food: {
  id: string; name: string; slug: string; kind: "STANDARD" | "COMBO"; basePrice: { toString(): string }; discountPercent: { toString(): string };
  description: string | null; isAvailable: boolean; imageUrl: string | null;
  categories: { categoryId: string }[]; tags: { tagId: string }[]; bundleItems: { componentFoodId: string }[];
}): FoodResult {
  return {
    id: food.id, name: food.name, slug: food.slug, kind: food.kind,
    basePrice: Number(food.basePrice), discountPercent: Number(food.discountPercent),
    description: food.description, isAvailable: food.isAvailable, imageUrl: food.imageUrl,
    categoryIds: food.categories.map(({ categoryId }) => categoryId),
    tagIds: food.tags.map(({ tagId }) => tagId),
    componentFoodIds: food.bundleItems.map(({ componentFoodId }) => componentFoodId),
  };
}

async function uploadOptionalImage(file: File | null, alt: string) {
  if (!file) return { imageUrl: null, imageDeleteUrl: null };
  const uploaded = await uploadImage(file, { alt });
  const imageUrl = new URL(uploaded.url);
  if (imageUrl.protocol !== "https:") {
    await deleteStoredImage(uploaded.deleteUrl);
    throw new Error("Image upload returned an invalid URL");
  }
  return { imageUrl: uploaded.url, imageDeleteUrl: uploaded.deleteUrl ?? null };
}

function parseFoodFormValues(formData: FormData) {
  const categoryIds = parseIdList(formData.get("categoryIds"));
  const tagIds = parseIdList(formData.get("tagIds"));
  const values = {
    name: formData.get("name"), slug: formData.get("slug") || undefined,
    discountPercent: formData.get("discountPercent") || 0,
    description: formData.get("description") || undefined,
    isAvailable: formData.get("isAvailable") !== "false",
    categoryIds, tagIds,
  };
  return values;
}

function parseStandardFoodForm(formData: FormData) {
  return standardFoodSchema.safeParse({ ...parseFoodFormValues(formData), basePrice: formData.get("basePrice") });
}

function parseComboFoodForm(formData: FormData) {
  return comboFoodSchema.safeParse({ ...parseFoodFormValues(formData), componentFoodIds: parseIdList(formData.get("componentFoodIds")) });
}

async function verifyComponents(componentFoodIds: string[]) {
  if (new Set(componentFoodIds).size !== componentFoodIds.length) return false;
  const components = await prisma.food.findMany({
    where: { id: { in: componentFoodIds }, kind: "STANDARD" },
    select: { id: true },
  });
  return components.length === componentFoodIds.length;
}

export async function createStandardFood(formData: FormData): Promise<{ success: true; food: FoodResult } | { error: string }> {
  const user = await requireStaffPermission("food:create");
  if (!user) return { error: "Forbidden" };
  const parsed = parseStandardFoodForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid food" };
  if (!(await verifyTaxonomy(parsed.data.categoryIds, parsed.data.tagIds))) return { error: "Invalid category or tag" };
  const image = validateImage(formData.get("image"));
  if (image.error) return { error: image.error };

  let uploaded: { imageUrl: string | null; imageDeleteUrl: string | null } | null = null;
  try {
    uploaded = await uploadOptionalImage(image.file ?? null, parsed.data.name);
    const food = await prisma.food.create({ data: {
      name: parsed.data.name, slug: await uniqueSlug(parsed.data.name, parsed.data.slug), kind: "STANDARD",
      basePrice: parsed.data.basePrice, discountPercent: parsed.data.discountPercent,
      description: parsed.data.description || null, isAvailable: parsed.data.isAvailable,
      imageUrl: uploaded.imageUrl, imageDeleteUrl: uploaded.imageDeleteUrl,
      categories: { create: parsed.data.categoryIds.map((categoryId) => ({ categoryId })) },
      tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
    }, include: { categories: true, tags: true, bundleItems: true } });
    await logAction({ userId: user.id, action: "FOOD_CREATE", entity: "Food", entityId: food.id, metadata: { kind: food.kind, name: food.name } });
    refreshFoodCatalog();
    return { success: true, food: serializeFood(food) };
  } catch (error) {
    await deleteStoredImage(uploaded?.imageDeleteUrl);
    return { error: error instanceof Error ? error.message : "Could not create food" };
  }
}

export async function createComboFood(formData: FormData): Promise<{ success: true; food: FoodResult } | { error: string }> {
  const user = await requireStaffPermission("food:create");
  if (!user) return { error: "Forbidden" };
  const parsed = parseComboFoodForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid combo" };
  if (!(await verifyTaxonomy(parsed.data.categoryIds, parsed.data.tagIds)) || !(await verifyComponents(parsed.data.componentFoodIds))) return { error: "Invalid category, tag, or standard-food component" };
  const image = validateImage(formData.get("image"));
  if (image.error) return { error: image.error };

  let uploaded: { imageUrl: string | null; imageDeleteUrl: string | null } | null = null;
  try {
    uploaded = await uploadOptionalImage(image.file ?? null, parsed.data.name);
    const food = await prisma.food.create({ data: {
      name: parsed.data.name, slug: await uniqueSlug(parsed.data.name, parsed.data.slug), kind: "COMBO", basePrice: 0,
      discountPercent: parsed.data.discountPercent, description: parsed.data.description || null,
      isAvailable: parsed.data.isAvailable, imageUrl: uploaded.imageUrl, imageDeleteUrl: uploaded.imageDeleteUrl,
      categories: { create: parsed.data.categoryIds.map((categoryId) => ({ categoryId })) },
      tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
      bundleItems: { create: parsed.data.componentFoodIds.map((componentFoodId) => ({ componentFoodId, quantity: 1 })) },
    }, include: { categories: true, tags: true, bundleItems: true } });
    await logAction({ userId: user.id, action: "FOOD_COMBO_CREATE", entity: "Food", entityId: food.id, metadata: { name: food.name, componentFoodIds: parsed.data.componentFoodIds } });
    refreshFoodCatalog();
    return { success: true, food: serializeFood(food) };
  } catch (error) {
    await deleteStoredImage(uploaded?.imageDeleteUrl);
    return { error: error instanceof Error ? error.message : "Could not create combo" };
  }
}

export async function updateFood(id: string, formData: FormData): Promise<{ success: true; food: FoodResult } | { error: string }> {
  const user = await requireStaffPermission("food:update");
  if (!user) return { error: "Forbidden" };
  if (!cuidSchema.safeParse(id).success) return { error: "Invalid food" };
  const existing = await prisma.food.findUnique({ where: { id } });
  if (!existing) return { error: "Food not found" };
  const parsed = existing.kind === "STANDARD" ? parseStandardFoodForm(formData) : parseComboFoodForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid food" };
  const basePrice = "basePrice" in parsed.data ? parsed.data.basePrice : 0;
  const componentFoodIds = "componentFoodIds" in parsed.data ? parsed.data.componentFoodIds : [];
  if (!(await verifyTaxonomy(parsed.data.categoryIds, parsed.data.tagIds))) return { error: "Invalid category or tag" };
  if (existing.kind === "COMBO" && !(await verifyComponents(componentFoodIds))) return { error: "A combo needs 2–3 distinct standard-food components" };
  const image = validateImage(formData.get("image"));
  if (image.error) return { error: image.error };

  let imageUrl = existing.imageUrl;
  let imageDeleteUrl = existing.imageDeleteUrl;
  let uploadedDeleteUrl: string | null = null;
  try {
    if (image.file) {
      const uploaded = await uploadOptionalImage(image.file, parsed.data.name);
      imageUrl = uploaded.imageUrl;
      imageDeleteUrl = uploaded.imageDeleteUrl;
      uploadedDeleteUrl = uploaded.imageDeleteUrl;
    }
    const food = await prisma.$transaction(async (tx) => {
      await tx.foodCategoryAssignment.deleteMany({ where: { foodId: id } });
      await tx.foodTagAssignment.deleteMany({ where: { foodId: id } });
      if (existing.kind === "COMBO") await tx.foodBundleItem.deleteMany({ where: { bundleFoodId: id } });
      return tx.food.update({ where: { id }, data: {
        name: parsed.data.name, slug: await uniqueSlug(parsed.data.name, parsed.data.slug, id),
        ...(existing.kind === "STANDARD" ? { basePrice } : { basePrice: 0 }),
        discountPercent: parsed.data.discountPercent, description: parsed.data.description || null,
        isAvailable: parsed.data.isAvailable, imageUrl, imageDeleteUrl,
        categories: { create: parsed.data.categoryIds.map((categoryId) => ({ categoryId })) },
        tags: { create: parsed.data.tagIds.map((tagId) => ({ tagId })) },
        ...(existing.kind === "COMBO" ? { bundleItems: { create: componentFoodIds.map((componentFoodId) => ({ componentFoodId, quantity: 1 })) } } : {}),
      }, include: { categories: true, tags: true, bundleItems: true } });
    });
    if (uploadedDeleteUrl) await deleteStoredImage(existing.imageDeleteUrl);
    await logAction({ userId: user.id, action: "FOOD_UPDATE", entity: "Food", entityId: food.id, metadata: { kind: food.kind, name: food.name } });
    refreshFoodCatalog();
    return { success: true, food: serializeFood(food) };
  } catch (error) {
    await deleteStoredImage(uploadedDeleteUrl);
    return { error: error instanceof Error ? error.message : "Could not update food" };
  }
}

export async function deleteFood(id: string): Promise<{ success: true } | { error: string }> {
  const user = await requireStaffPermission("food:delete");
  if (!user) return { error: "Forbidden" };
  if (!cuidSchema.safeParse(id).success) return { error: "Invalid food" };
  const food = await prisma.food.findUnique({ where: { id }, select: { id: true, name: true, imageDeleteUrl: true, componentOf: { select: { bundleFoodId: true } } } });
  if (!food) return { error: "Food not found" };
  if (food.componentOf.length > 0) return { error: "Remove this food from its combos before deleting it" };
  await prisma.food.delete({ where: { id } });
  await deleteStoredImage(food.imageDeleteUrl);
  await logAction({ userId: user.id, action: "FOOD_DELETE", entity: "Food", entityId: id, metadata: { name: food.name } });
  refreshFoodCatalog();
  return { success: true };
}

async function createTaxonomy(kind: "category" | "tag", name: string): Promise<{ success: true; item: { id: string; name: string; slug: string } } | { error: string }> {
  const user = await requireStaffPermission(kind === "category" ? "food-category:manage" : "food-tag:manage");
  if (!user) return { error: "Forbidden" };
  const parsed = taxonomyNameSchema.safeParse(name);
  if (!parsed.success) return { error: "Name must be 2–60 characters" };
  const slug = slugify(parsed.data);
  try {
    const item = kind === "category"
      ? await prisma.foodCategory.create({ data: { name: parsed.data, slug }, select: { id: true, name: true, slug: true } })
      : await prisma.foodTag.create({ data: { name: parsed.data, slug }, select: { id: true, name: true, slug: true } });
    await logAction({ userId: user.id, action: `FOOD_${kind.toUpperCase()}_CREATE`, entity: kind === "category" ? "FoodCategory" : "FoodTag", metadata: { name: parsed.data } });
    refreshFoodCatalog();
    return { success: true, item };
  } catch {
    return { error: `That ${kind} already exists` };
  }
}

export async function createFoodCategory(name: string) { return createTaxonomy("category", name); }
export async function createFoodTag(name: string) { return createTaxonomy("tag", name); }

async function deleteTaxonomy(kind: "category" | "tag", id: string): Promise<{ success: true } | { error: string }> {
  const user = await requireStaffPermission(kind === "category" ? "food-category:manage" : "food-tag:manage");
  if (!user) return { error: "Forbidden" };
  if (!cuidSchema.safeParse(id).success) return { error: `Invalid ${kind}` };
  const assigned = kind === "category"
    ? await prisma.foodCategoryAssignment.count({ where: { categoryId: id } })
    : await prisma.foodTagAssignment.count({ where: { tagId: id } });
  if (assigned > 0) return { error: `Remove this ${kind} from its foods before deleting it` };
  const deleted = kind === "category"
    ? await prisma.foodCategory.deleteMany({ where: { id } })
    : await prisma.foodTag.deleteMany({ where: { id } });
  if (deleted.count === 0) return { error: `${kind === "category" ? "Category" : "Tag"} not found` };
  await logAction({ userId: user.id, action: `FOOD_${kind.toUpperCase()}_DELETE`, entity: kind === "category" ? "FoodCategory" : "FoodTag", entityId: id });
  refreshFoodCatalog();
  return { success: true };
}

export async function deleteFoodCategory(id: string) { return deleteTaxonomy("category", id); }
export async function deleteFoodTag(id: string) { return deleteTaxonomy("tag", id); }

export async function getStaffFoods(filters: { limit?: number; cursor?: string; query?: string; kind?: "STANDARD" | "COMBO" } = {}) {
  const user = await requireStaffPermission("food:view");
  if (!user) return { error: "Forbidden" as const };
  return getFoodCatalog({ ...filters, includeUnavailable: true });
}

export async function getStaffFoodTaxonomy() {
  const user = await requireStaffPermission("food:view");
  if (!user) return { error: "Forbidden" as const };
  return getFoodTaxonomy();
}

async function getPrimaryStaffStoreId(userId: string) {
  const access = await prisma.staffStoreAccess.findFirst({
    where: { userId }, select: { storeId: true }, orderBy: { isPrimary: "desc" },
  });
  return access?.storeId ?? null;
}

export async function getStaffFoodInventory() {
  const user = await requireStaffPermission("food:view");
  if (!user) return { error: "Forbidden" as const };
  const storeId = await getPrimaryStaffStoreId(user.id);
  if (!storeId) return { error: "No primary store is assigned" as const };
  const catalog = await getFoodCatalog({ storeId, includeUnavailable: true, limit: 100 });
  return { ...catalog, storeId };
}

export async function setFoodStoreAvailability(foodId: string, isAvailable: boolean) {
  const user = await requireStaffPermission("food:update");
  if (!user) return { error: "Forbidden" as const };
  if (!cuidSchema.safeParse(foodId).success || typeof isAvailable !== "boolean") return { error: "Invalid availability request" as const };
  const storeId = await getPrimaryStaffStoreId(user.id);
  if (!storeId) return { error: "No primary store is assigned" as const };
  const food = await prisma.food.findUnique({ where: { id: foodId }, select: { id: true } });
  if (!food) return { error: "Food not found" as const };
  await prisma.foodStoreAvailability.upsert({
    where: { foodId_storeId: { foodId, storeId } },
    create: { foodId, storeId, isAvailable },
    update: { isAvailable },
  });
  await logAction({ userId: user.id, action: "FOOD_STORE_AVAILABILITY_UPDATE", entity: "FoodStoreAvailability", entityId: foodId, metadata: { storeId, isAvailable } });
  revalidateTag("foods", "default");
  revalidatePath("/staff/operations/inventory");
  return { success: true as const };
}
