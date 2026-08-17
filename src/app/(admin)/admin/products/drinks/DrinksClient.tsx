"use client";

import { useState } from "react";
import DataTable from "@/components/admin/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { usePermissions } from "@/hooks/use-can";
import dynamic from "next/dynamic";
import { deleteDrink, getDrinks } from "@/features/products/actions";

const CreateDrinkModal = dynamic(() => import("@/components/admin/create-drink-modal").then(m => m.default), { ssr: false });
const EditDrinkModal = dynamic(() => import("@/components/admin/edit-drink-modal").then(m => m.default), { ssr: false });

type DrinkRow = { id: string; name: string; price: string; tag: string; available: string };
type DrinkRowFull = { id: string; name: string; slug: string; price: number; discountPrice: number | null; description: string | null; isAvailable: boolean; tag: string | null; imageUrl: string | null };

export function DrinksClient({ initialDrinks, initialNextCursor }: { initialDrinks: DrinkRowFull[]; initialNextCursor?: string | null }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState<DrinkRowFull | null>(null);
  const [drinks, setDrinks] = useState<DrinkRow[]>(() =>
    initialDrinks.map((d) => ({
      id: d.id,
      name: d.name,
      price: `$${Number(d.price).toFixed(2)}`,
      tag: d.tag ?? "-",
      available: d.isAvailable ? "Yes" : "No",
    }))
  );
  const [fullDrinks, setFullDrinks] = useState<DrinkRowFull[]>(initialDrinks);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>(initialNextCursor);
  const { can } = usePermissions();
  const canCreateDrink = can("food:create");
  const canUpdateDrink = can("food:update");
  const canDeleteDrink = can("food:delete");

  const filtered = drinks.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q);
  });

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const result = await getDrinks({ limit: 20, cursor: nextCursor });
    if (!("error" in result) && result.drinks) {
      const newFull = result.drinks as DrinkRowFull[];
      setDrinks((prev) => [...prev, ...newFull.map((d) => ({ id: d.id, name: d.name, price: `$${Number(d.price).toFixed(2)}`, tag: d.tag ?? "-", available: d.isAvailable ? "Yes" : "No" }))]);
      setFullDrinks((prev) => [...prev, ...newFull]);
      setNextCursor(result.nextCursor);
    }
    setLoadingMore(false);
  };

  const handleCreated = (drink: { id: string; name: string; price: number; tag: string | null; isAvailable: boolean }) => {
    setDrinks((prev) => [{ id: drink.id, name: drink.name, price: `$${Number(drink.price).toFixed(2)}`, tag: drink.tag ?? "-", available: drink.isAvailable ? "Yes" : "No" }, ...prev]);
  };

  const handleUpdated = (drink: DrinkRowFull) => {
    setDrinks((prev) => prev.map((d) => d.id === drink.id ? { id: drink.id, name: drink.name, price: `$${Number(drink.price).toFixed(2)}`, tag: drink.tag ?? "-", available: drink.isAvailable ? "Yes" : "No" } : d));
    setFullDrinks((prev) => prev.map((d) => (d.id === drink.id ? drink : d)));
  };

  const handleEdit = (row: Record<string, unknown>) => {
    const full = fullDrinks.find((d) => d.id === row.id);
    if (full) { setSelectedDrink(full); setEditOpen(true); }
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const id = row.id as string;
    if (!confirm("Delete this drink? This cannot be undone.")) return;
    const res = await deleteDrink(id);
    if ("error" in res) { alert(res.error); return; }
    setDrinks((prev) => prev.filter((d) => d.id !== id));
    setFullDrinks((prev) => prev.filter((d) => d.id !== id));
  };

  const showActions = canUpdateDrink || canDeleteDrink;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Drinks</h1>
        <div className="flex items-center gap-3">
          <Input placeholder="Search drinks..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" data-testid="admin-search" />
          {canCreateDrink && (<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New Drink</Button>)}
        </div>
      </div>

      <DataTable columns={["Name", "Price", "Tag", "Available"]} data={filtered} showActions={showActions} onEdit={canUpdateDrink ? handleEdit : undefined} onDelete={canDeleteDrink ? handleDelete : undefined} />

      {nextCursor && (
        <div className="flex justify-center">
          <Button onClick={loadMore} disabled={loadingMore} variant="outline">
            {loadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      {open && <CreateDrinkModal onClose={() => setOpen(false)} onCreated={handleCreated} />}
      {editOpen && selectedDrink && (<EditDrinkModal drink={selectedDrink} onClose={() => setEditOpen(false)} onUpdated={handleUpdated} />)}
    </div>
  );
}
