"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePermissions } from "@/hooks/use-can";
import { useRequestDedupe } from "@/hooks/use-request-dedupe";
import dynamic from "next/dynamic";

const CreateDishModal = dynamic(() => import("@/components/admin/create-dish-modal").then(m => m.default), {
  ssr: false,
});

const EditDishModal = dynamic(() => import("@/components/admin/edit-dish-modal").then(m => m.default), {
  ssr: false,
});

import { getDishes, deleteDish } from "@/features/products/actions";

type DishRow = {
  id: string;
  name: string;
  price: string;
  tag: string;
  available: string;
};

type DishRowFull = {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  description: string | null;
  isAvailable: boolean;
  tag: string | null;
  imageUrl: string | null;
};

export default function DishesPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<DishRowFull | null>(null);
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [fullDishes, setFullDishes] = useState<DishRowFull[]>([]);
  const { can } = usePermissions();
  const canCreateDish = can("food:create");
  const canUpdateDish = can("food:update");
  const canDeleteDish = can("food:delete");
  const { dedupe } = useRequestDedupe();

  useEffect(() => {
    let active = true;
    dedupe("getDishes", () => getDishes()).then((result) => {
      if (active && !("error" in result) && result.dishes) {
        const full = result.dishes as DishRowFull[];
        setFullDishes(full);
        setDishes(
          full.map((d) => ({
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
  }, [dedupe]);

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

  const handleUpdated = (dish: DishRowFull) => {
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dish.id
          ? {
              id: dish.id,
              name: dish.name,
              price: `$${Number(dish.price).toFixed(2)}`,
              tag: dish.tag ?? "-",
              available: dish.isAvailable ? "Yes" : "No",
            }
          : d
      )
    );
    setFullDishes((prev) => prev.map((d) => (d.id === dish.id ? dish : d)));
  };

  const handleEdit = (row: Record<string, unknown>) => {
    const full = fullDishes.find((d) => d.id === row.id);
    if (full) {
      setSelectedDish(full);
      setEditOpen(true);
    }
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const id = row.id as string;
    if (!confirm("Delete this dish? This cannot be undone.")) return;
    const res = await deleteDish(id);
    if ("error" in res) {
      alert(res.error);
      return;
    }
    setDishes((prev) => prev.filter((d) => d.id !== id));
    setFullDishes((prev) => prev.filter((d) => d.id !== id));
  };

  const showActions = canUpdateDish || canDeleteDish;

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

      <DataTable
        columns={["Name", "Price", "Tag", "Available"]}
        data={filtered}
        showActions={showActions}
        onEdit={canUpdateDish ? handleEdit : undefined}
        onDelete={canDeleteDish ? handleDelete : undefined}
      />

      {open && <CreateDishModal onClose={() => setOpen(false)} onCreated={handleCreated} />}
      {editOpen && selectedDish && (
        <EditDishModal dish={selectedDish} onClose={() => setEditOpen(false)} onUpdated={handleUpdated} />
      )}
    </div>
  );
}
