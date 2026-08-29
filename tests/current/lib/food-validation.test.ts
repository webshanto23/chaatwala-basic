import { describe, expect, it } from "vitest";
import { comboFoodSchema, standardFoodSchema } from "@/lib/validations/food";

const categoryId = "clw3g4h5i0000jklm6nop7qrs";

describe("Food validation", () => {
  it("accepts standard Food and rejects an unsafe price", () => {
    expect(standardFoodSchema.safeParse({ name: "Fuchka", basePrice: 120, categoryIds: [categoryId] }).success).toBe(true);
    expect(standardFoodSchema.safeParse({ name: "Fuchka", basePrice: 0, categoryIds: [categoryId] }).success).toBe(false);
  });

  it("requires two or three Food components for a combo", () => {
    const base = { name: "Meal deal", categoryIds: [categoryId], componentFoodIds: [categoryId] };
    expect(comboFoodSchema.safeParse(base).success).toBe(false);
    expect(comboFoodSchema.safeParse({ ...base, componentFoodIds: [categoryId, "clw3g4h5i0001jklm6nop7qrs"] }).success).toBe(true);
  });
});
