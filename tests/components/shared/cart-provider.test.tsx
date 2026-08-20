import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "@/features/cart/context";

const authState = {
  isAuthenticated: true,
  isLoading: false,
  userId: "user_1" as string | null,
  role: "user" as "user" | "admin" | null,
  name: "User One",
  permissions: [],
};

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ auth: authState }),
}));

function CartProbe() {
  const { cart, isLoading } = useCart();
  return <p>{isLoading ? "loading" : cart.id}</p>;
}

describe("CartProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.userId = "user_1";
    authState.isLoading = false;
    authState.role = "user";
  });

  it("reloads the cart when the authenticated user changes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: { id: "cart_1", items: [] } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: { id: "cart_2", items: [] } }) });
    vi.stubGlobal("fetch", fetchMock);

    const view = render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByText("cart_1")).toBeDefined());

    authState.userId = "user_2";
    view.rerender(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByText("cart_2")).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
