"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePermissions } from "@/hooks/use-can";

import CreateDishModal from "@/components/admin/create-dish-modal";
import { getDishes } from "@/features/products/actions";

type DishRow = {
  id: string;
  name: string;
  price: string;
  tag: string;
  available: string;
};

export default function DishesPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const { can } = usePermissions();
  const canCreateDish = can("food:create");

  useEffect(() => {
    let active = true;
    getDishes().then((result) => {
      if (active && !("error" in result) && result.dishes) {
        setDishes(
          result.dishes.map((d) => ({
            id: d.id,
            name: d.name,
            price: `$${Number(d.price).toFixed(2)}`,
            tag: d.tag ?? "-",
            available: d.isAvailable ? "Yes" : "No",
          }))
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = dishes.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q);
  });

  const handleCreated = (dish: { id: string; name: string; price: number; tag: string | null; isAvailable: boolean }) => {
    setDishes((prev) => [
      {
        id: dish.id,
        name: dish.name,
        price: `$${Number(dish.price).toFixed(2)}`,
        tag: dish.tag ?? "-",
        available: dish.isAvailable ? "Yes" : "No",
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dishes</h1>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search dishes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
            data-testid="admin-search"
          />
          {canCreateDish && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              New Dish
            </Button>
          )}
        </div>
      </div>

      <DataTable columns={["Name", "Price", "Tag", "Available"]} data={filtered} />

      {open && <CreateDishModal onClose={() => setOpen(false)} onCreated={handleCreated} />}
    </div>
  );
}
