import { z } from "zod";

export const DISH_TAGS = ["popular", "spicy", "new"] as const;

export const createDishSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  discountPrice: z.coerce.number().nonnegative("Discount price cannot be negative").optional(),
  description: z.string().max(100, "Description must be 100 characters or less").optional(),
  isAvailable: z.boolean().optional().default(true),
  tag: z.enum(DISH_TAGS).optional(),
});

export type CreateDishInput = z.infer<typeof createDishSchema>;
