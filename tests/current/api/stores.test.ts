import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ prisma: { store: { findMany: vi.fn() } } }));
vi.mock("@/lib/prisma", () => ({ default: mocks.prisma }));
import { GET } from "@/app/api/stores/route";

describe("customer store list", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("returns only stores available for checkout", async () => {
    mocks.prisma.store.findMany.mockResolvedValue([{ id: "store_1", name: "Dhanmondi", address: "Road 1" }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ stores: [{ id: "store_1", name: "Dhanmondi", address: "Road 1" }] });
    expect(mocks.prisma.store.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isOpen: true } }));
  });
});
