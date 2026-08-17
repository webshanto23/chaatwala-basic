import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { InventoryClient } from "@/app/store-manager/inventory/InventoryClient";

vi.mock("@/features/store-manager/actions", () => ({
  getStoreInventory: vi.fn(),
  toggleStoreItemAvailability: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { getStoreInventory, toggleStoreItemAvailability } from "@/features/store-manager/actions";
import { toast } from "sonner";

describe("InventoryClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", async () => {
    vi.mocked(getStoreInventory).mockResolvedValue({
      dishes: [],
      drinks: [],
      combos: [],
    });

    render(<InventoryClient />);
    expect(screen.getByText("Menu / Inventory Management")).toBeDefined();
  });

  it("renders tab buttons", async () => {
    vi.mocked(getStoreInventory).mockResolvedValue({
      dishes: [],
      drinks: [],
      combos: [],
    });

    render(<InventoryClient />);

    const dishButtons = screen.getAllByRole("button", { name: "Dishes" });
    const drinkButtons = screen.getAllByRole("button", { name: "Drinks" });
    const comboButtons = screen.getAllByRole("button", { name: "Combos" });
    expect(dishButtons.length).toBeGreaterThan(0);
    expect(drinkButtons.length).toBeGreaterThan(0);
    expect(comboButtons.length).toBeGreaterThan(0);
  });

  it("renders search input", async () => {
    vi.mocked(getStoreInventory).mockResolvedValue({
      dishes: [],
      drinks: [],
      combos: [],
    });

    render(<InventoryClient />);

    const searchInputs = screen.getAllByPlaceholderText("Search items...");
    expect(searchInputs.length).toBeGreaterThan(0);
  });

  it("shows error toast when inventory fetch fails", async () => {
    vi.mocked(getStoreInventory).mockResolvedValue({
      error: "Failed to load inventory",
    });

    render(<InventoryClient />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load inventory");
    });
  });

  it("calls getStoreInventory on mount", async () => {
    vi.mocked(getStoreInventory).mockResolvedValue({
      dishes: [],
      drinks: [],
      combos: [],
    });

    render(<InventoryClient />);

    await waitFor(() => {
      expect(getStoreInventory).toHaveBeenCalled();
    });
  });
});
