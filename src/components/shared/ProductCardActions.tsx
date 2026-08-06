"use client";

import { Plus, Minus } from "lucide-react";
import { useCart } from "@/features/cart/context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

type ProductCardActionsProps = {
  id: string;
  productType: "dish" | "drink";
};

export function ProductCardActions({ id, productType }: ProductCardActionsProps) {
  const { cart, addItem, updateQuantity, removeItem } = useCart();
  const { auth } = useAuth();
  const isAdmin = auth.permissions.includes("admin:access");

  const cartItem = cart.items.find(
    (item) => item.productId === id && item.productType === productType,
  );

  const quantity = cartItem?.quantity ?? 0;

  const handleAdd = async () => {
    if (isAdmin) return;
    await addItem({ productId: id, productType, quantity: 1 });
  };

  const handleIncrement = async () => {
    if (isAdmin) return;
    await addItem({ productId: id, productType, quantity: 1 });
  };

  const handleDecrement = async () => {
    if (isAdmin) return;
    if (!cartItem) return;
    if (quantity <= 1) {
      await removeItem(cartItem.id);
    } else {
      await updateQuantity(cartItem.id, quantity - 1);
    }
  };

  if (quantity === 0) {
    return (
      <Button
        size="sm"
        className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleAdd}
        disabled={isAdmin}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-full border border-border/70 bg-background/90 p-2">
      <Button
        size="sm"
        variant="outline"
        className="h-9 w-9 rounded-full p-0"
        onClick={handleDecrement}
        disabled={isAdmin}
      >
        <Minus className="h-3 w-3" />
      </Button>

      <span className="font-medium text-sm">{quantity}</span>

      <Button
        size="sm"
        className="h-9 w-9 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleIncrement}
        disabled={isAdmin}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
