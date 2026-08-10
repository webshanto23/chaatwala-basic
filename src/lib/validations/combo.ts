import { z } from "zod";

export const COMBO_TAGS = ["popular", "new", "value"] as const;

export const createComboSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional(),
  items: z.array(z.string().min(1)).min(1, "At least one item is required"),
  price: z.coerce.number().positive("Price must be a positive number"),
  originalPrice: z.coerce.number().positive("Original price must be a positive number"),
  isAvailable: z.boolean().optional().default(true),
  tag: z.enum(COMBO_TAGS).optional(),
});

export type CreateComboInput = z.infer<typeof createComboSchema>;
