"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePermissions } from "@/hooks/use-can";

import CreateDrinkModal from "@/components/admin/create-drink-modal";
import { getDrinks } from "@/features/products/actions";

type DrinkRow = {
  id: string;
  name: string;
  price: string;
  tag: string;
  available: string;
};

export default function DrinksPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [drinks, setDrinks] = useState<DrinkRow[]>([]);
  const { can } = usePermissions();
  const canCreateDrink = can("food:create");

  useEffect(() => {
    let active = true;
    getDrinks().then((result) => {
      if (active && !("error" in result) && result.drinks) {
        setDrinks(
          result.drinks.map((d) => ({
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

  const filtered = drinks.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q);
  });

  const handleCreated = (drink: { id: string; name: string; price: number; tag: string | null; isAvailable: boolean }) => {
    setDrinks((prev) => [
      {
        id: drink.id,
        name: drink.name,
        price: `$${Number(drink.price).toFixed(2)}`,
        tag: drink.tag ?? "-",
        available: drink.isAvailable ? "Yes" : "No",
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Drinks</h1>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search drinks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
            data-testid="admin-search"
          />
          {canCreateDrink && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              New Drink
            </Button>
          )}
        </div>
      </div>

      <DataTable columns={["Name", "Price", "Tag", "Available"]} data={filtered} />

      {open && <CreateDrinkModal onClose={() => setOpen(false)} onCreated={handleCreated} />}
    </div>
  );
}
