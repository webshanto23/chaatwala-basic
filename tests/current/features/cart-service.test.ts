import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), cookies: vi.fn(), findProduct: vi.fn(), getEffectivePrice: vi.fn(),
  prisma: { cart: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() }, cartItem: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/products", () => ({ findProduct: mocks.findProduct, getEffectivePrice: mocks.getEffectivePrice }));
vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));

import { addToCart, removeCartItem, updateCartItem } from "@/features/cart/service";

const customer = { user: { id: "customer_1", workspace: "customer" } };
const cart = { id: "cart_1", userId: "customer_1", guestId: null, items: [], createdAt: new Date(), updatedAt: new Date() };

describe("cart service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(customer);
    mocks.prisma.cart.findFirst.mockResolvedValue(cart);
    mocks.prisma.cartItem.create.mockResolvedValue({});
    mocks.findProduct.mockResolvedValue({ id: "food_1", name: "Fuchka", basePrice: 200, discountPercent: 25, imageUrl: null });
    mocks.getEffectivePrice.mockReturnValue(150);
  });

  it("creates a Food cart item using the trusted server price", async () => {
    await addToCart({ productId: "food_1", productType: "food", quantity: 2 });
    expect(mocks.prisma.cartItem.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ productId: "food_1", productType: "food", price: 150, quantity: 2 }) }));
  });

  it("rejects legacy types and cross-customer item changes", async () => {
    await expect(addToCart({ productId: "food_1", productType: "dish" })).rejects.toThrow("Invalid productType");
    mocks.prisma.cartItem.findUnique.mockResolvedValue({ id: "item_1", cart: { id: "cart_other", userId: "customer_2", guestId: null } });
    await expect(updateCartItem("item_1", 2)).rejects.toThrow("Unauthorized");
    await expect(removeCartItem("item_1")).rejects.toThrow("Unauthorized");
    expect(mocks.prisma.cartItem.update).not.toHaveBeenCalled();
    expect(mocks.prisma.cartItem.delete).not.toHaveBeenCalled();
  });
});
