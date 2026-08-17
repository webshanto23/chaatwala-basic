import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/stores/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    store: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";

const mockStore = {
  id: "store_1",
  name: "Test Store",
  address: "123 Test Street",
};

describe("Stores API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list of stores", async () => {
    vi.mocked(prisma.store.findMany).mockResolvedValue([mockStore] as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stores).toHaveLength(1);
    expect(data.stores[0].id).toBe("store_1");
    expect(prisma.store.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        address: true,
      },
      orderBy: { name: "asc" },
    });
  });

  it("returns empty array when no stores exist", async () => {
    vi.mocked(prisma.store.findMany).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stores).toEqual([]);
  });
});
