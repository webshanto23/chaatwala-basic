import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/search/route";

vi.mock("@/lib/prisma", () => ({
  default: {
    dish: {
      findMany: vi.fn(),
    },
    drink: {
      findMany: vi.fn(),
    },
    combo: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";

const mockDish = {
  id: "dish_1",
  name: "Test Dish",
  description: "A test dish",
  tag: "popular",
};

const mockDrink = {
  id: "drink_1",
  name: "Test Drink",
  description: "A test drink",
  tag: "popular",
};

const mockCombo = {
  id: "combo_1",
  name: "Test Combo",
  items: ["dish_1", "drink_1"],
};

describe("Search API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns search results for dishes, drinks, and combos", async () => {
    vi.mocked(prisma.dish.findMany).mockResolvedValue([mockDish] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([mockDrink] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([mockCombo] as any);

    const request = new Request("http://localhost/api/search?q=test");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(3);
    expect(data.results.map((r: { label: string }) => r.label)).toEqual([
      "Test Dish",
      "Test Drink",
      "Test Combo",
    ]);
  });

  it("returns empty results for empty query", async () => {
    const request = new Request("http://localhost/api/search?q=");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
    expect(prisma.dish.findMany).not.toHaveBeenCalled();
  });

  it("returns empty results when no matches found", async () => {
    vi.mocked(prisma.dish.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);

    const request = new Request("http://localhost/api/search?q=nonexistent");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
  });

  it("searches case-insensitively", async () => {
    vi.mocked(prisma.dish.findMany).mockResolvedValue([mockDish] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);

    const request = new Request("http://localhost/api/search?q=TEST");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(prisma.dish.findMany).toHaveBeenCalledWith({
      where: {
        isAvailable: true,
        OR: [
          { name: { contains: "test", mode: "insensitive" } },
          { description: { contains: "test", mode: "insensitive" } },
          { tag: { contains: "test", mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, description: true, tag: true },
    });
  });

  it("does not search unavailable products", async () => {
    vi.mocked(prisma.dish.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);

    const request = new Request("http://localhost/api/search?q=test");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
    expect(prisma.dish.findMany).toHaveBeenCalledWith({
      where: {
        isAvailable: true,
        OR: expect.any(Array),
      },
      select: { id: true, name: true, description: true, tag: true },
    });
  });

  it("returns results with correct href and category", async () => {
    vi.mocked(prisma.dish.findMany).mockResolvedValue([mockDish] as any);
    vi.mocked(prisma.drink.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.combo.findMany).mockResolvedValue([] as any);

    const request = new Request("http://localhost/api/search?q=test");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results[0].href).toBe("/products/dishes");
    expect(data.results[0].category).toBe("popular");
  });
});
