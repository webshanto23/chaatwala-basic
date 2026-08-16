import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("combo CRUD existence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createCombo is exported from products actions", () => {
    const content = readFileSync(join(process.cwd(), "src/features/products/actions.ts"), "utf-8");
    expect(content.includes("export async function createCombo")).toBe(true);
  });

  it("updateCombo is exported from products actions", () => {
    const content = readFileSync(join(process.cwd(), "src/features/products/actions.ts"), "utf-8");
    expect(content.includes("export async function updateCombo")).toBe(true);
  });

  it("deleteCombo is exported from products actions", () => {
    const content = readFileSync(join(process.cwd(), "src/features/products/actions.ts"), "utf-8");
    expect(content.includes("export async function deleteCombo")).toBe(true);
  });

  it("getCombos is exported from products actions", () => {
    const content = readFileSync(join(process.cwd(), "src/features/products/actions.ts"), "utf-8");
    expect(content.includes("export async function getCombos")).toBe(true);
  });
});

describe("combo validation schema", () => {
  it("createComboSchema exists and validates valid input", async () => {
    const { createComboSchema } = await import("@/lib/validations/combo");
    const result = createComboSchema.safeParse({
      name: "Test Combo",
      items: ["dish_1", "drink_1"],
      price: 250,
      originalPrice: 300,
    });
    expect(result.success).toBe(true);
  });

  it("createComboSchema rejects empty name", async () => {
    const { createComboSchema } = await import("@/lib/validations/combo");
    const result = createComboSchema.safeParse({
      name: "",
      items: ["dish_1"],
      price: 250,
      originalPrice: 300,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name must be at least 2 characters");
    }
  });

  it("createComboSchema rejects negative price", async () => {
    const { createComboSchema } = await import("@/lib/validations/combo");
    const result = createComboSchema.safeParse({
      name: "Test Combo",
      items: ["dish_1"],
      price: -100,
      originalPrice: 300,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Price must be a positive number");
    }
  });

  it("createComboSchema rejects empty items array", async () => {
    const { createComboSchema } = await import("@/lib/validations/combo");
    const result = createComboSchema.safeParse({
      name: "Test Combo",
      items: [],
      price: 250,
      originalPrice: 300,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("At least one item is required");
    }
  });
});
