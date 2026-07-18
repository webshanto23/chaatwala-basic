"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem, AddToCartInput, ProductType } from "./types";

type CartContextValue = {
  cart: {
    id: string;
    items: CartItem[];
  };
  isLoading: boolean;
  error: string | null;
  totalItems: number;
  total: number;
  addItem: (input: AddToCartInput) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<{ id: string; items: CartItem[] }>({ id: "", items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCart({
        id: data.cart.id,
        items: data.cart.items.map((item: {
          id: string;
          productId: string;
          productType: ProductType;
          name: string;
          price: number;
          quantity: number;
          imageUrl: string | null;
          createdAt: string;
          updatedAt: string;
        }) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (!cancelled) {
        await refresh();
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const addItem = useCallback(async (input: AddToCartInput) => {
    setError(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      let errorMessage = `Failed to add item (status: ${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) errorMessage = data.error;
      } catch {
        try {
          const text = await res.text();
          if (text) errorMessage = text.slice(0, 200);
        } catch {
          // keep default message
        }
      }
      throw new Error(errorMessage);
    }
    const data = await res.json();
    setCart({
      id: data.cart.id,
      items: data.cart.items.map((item: {
        id: string;
        productId: string;
        productType: ProductType;
        name: string;
        price: number;
        quantity: number;
        imageUrl: string | null;
        createdAt: string;
        updatedAt: string;
      }) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })),
    });
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setError(null);
    const res = await fetch(`/api/cart/item/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update item");
    }
    const data = await res.json();
    setCart((prev) => ({
      id: prev.id,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, ...data.item, createdAt: new Date(data.item.createdAt), updatedAt: new Date(data.item.updatedAt) } : item
      ),
    }));
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setError(null);
    const res = await fetch(`/api/cart/item/${itemId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to remove item");
    }
    const data = await res.json();
    if (data.cart) {
      setCart({
        id: data.cart.id,
        items: data.cart.items.map((item: {
          id: string;
          productId: string;
          productType: ProductType;
          name: string;
          price: number;
          quantity: number;
          imageUrl: string | null;
          createdAt: string;
          updatedAt: string;
        }) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
      });
    } else {
      setCart((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== itemId) }));
    }
  }, []);

  const totalItems = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items]
  );

  const total = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart.items]
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        totalItems,
        total,
        addItem,
        updateQuantity,
        removeItem,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
