import { z } from "zod";

export const foodSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens").optional();

export const standardFoodSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: foodSlugSchema,
  basePrice: z.coerce.number().positive(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  description: z.string().trim().max(500).optional(),
  isAvailable: z.boolean().default(true),
  categoryIds: z.array(z.string().cuid()).min(1),
  tagIds: z.array(z.string().cuid()).max(20).default([]),
});

export const comboFoodSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: foodSlugSchema,
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  description: z.string().trim().max(500).optional(),
  isAvailable: z.boolean().default(true),
  categoryIds: z.array(z.string().cuid()).min(1),
  tagIds: z.array(z.string().cuid()).max(20).default([]),
  componentFoodIds: z.array(z.string().cuid()).min(2).max(3),
});
