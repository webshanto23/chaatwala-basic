import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), rate: vi.fn(), ip: vi.fn(), revalidate: vi.fn(), cookies: vi.fn(),
  prisma: { cartItem: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() }, cart: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.rate, getClientIp: mocks.ip }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidate }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));

import { DELETE, PATCH } from "@/app/api/cart/item/[id]/route";

describe("customer cart item API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "customer_1", workspace: "customer" } });
    mocks.rate.mockResolvedValue({ success: true });
    mocks.ip.mockReturnValue("127.0.0.1");
  });

  it("rejects staff before reading cart data", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "staff_1", workspace: "staff" } });
    const response = await PATCH(new Request("http://localhost/api/cart/item/item_1", { method: "PATCH", body: JSON.stringify({ quantity: 2 }) }), { params: Promise.resolve({ id: "item_1" }) });
    expect(response.status).toBe(403);
    expect(mocks.prisma.cartItem.findUnique).not.toHaveBeenCalled();
  });

  it("does not modify an item owned by another customer", async () => {
    mocks.prisma.cartItem.findUnique.mockResolvedValue({ cartId: "cart_2" });
    mocks.prisma.cart.findUnique.mockResolvedValue({ id: "cart_2", userId: "customer_2", guestId: null });
    const response = await DELETE(new Request("http://localhost/api/cart/item/item_1", { method: "DELETE" }), { params: Promise.resolve({ id: "item_1" }) });
    expect(response.status).toBe(404);
    expect(mocks.prisma.cartItem.delete).not.toHaveBeenCalled();
  });
});
