"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import Image from "next/image";
import {
  getStoreDishes,
  deleteStoreDish,
  getStoreDrinks,
  deleteStoreDrink,
  getStoreCombos,
  deleteStoreCombo,
} from "@/features/store-manager/actions";
import CreateDishModal from "@/components/store-manager/create-dish-modal";
import EditDishModal from "@/components/store-manager/edit-dish-modal";
import CreateDrinkModal from "@/components/store-manager/create-drink-modal";
import EditDrinkModal from "@/components/store-manager/edit-drink-modal";
import CreateComboModal from "@/components/store-manager/create-combo-modal";
import EditComboModal from "@/components/store-manager/edit-combo-modal";

type Dish = {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  tag: string | null;
  imageUrl: string | null;
};

type Drink = {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  tag: string | null;
  imageUrl: string | null;
};

type Combo = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  isAvailable: boolean;
  imageUrl: string | null;
  items: string[];
};

type Tab = "dishes" | "drinks" | "combos";

export function InventoryClient() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("dishes");

  const [dishCreateOpen, setDishCreateOpen] = useState(false);
  const [dishEditOpen, setDishEditOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const [drinkCreateOpen, setDrinkCreateOpen] = useState(false);
  const [drinkEditOpen, setDrinkEditOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);

  const [comboCreateOpen, setComboCreateOpen] = useState(false);
  const [comboEditOpen, setComboEditOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, drRes, cRes] = await Promise.all([getStoreDishes(), getStoreDrinks(), getStoreCombos()]);
      if ("dishes" in dRes) setDishes(dRes.dishes ?? []);
      if ("drinks" in drRes) setDrinks(drRes.drinks ?? []);
      if ("combos" in cRes) setCombos(cRes.combos ?? []);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [dRes, drRes, cRes] = await Promise.all([getStoreDishes(), getStoreDrinks(), getStoreCombos()]);
        if (!cancelled) {
          if ("dishes" in dRes) setDishes(dRes.dishes ?? []);
          if ("drinks" in drRes) setDrinks(drRes.drinks ?? []);
          if ("combos" in cRes) setCombos(cRes.combos ?? []);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load inventory");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeleteDish = async (id: string) => {
    const res = await deleteStoreDish(id);
    if ("success" in res) {
      toast.success("Dish deleted");
      setDishes((prev) => prev.filter((d) => d.id !== id));
    } else {
      toast.error(res.error);
    }
  };

  const handleDeleteDrink = async (id: string) => {
    const res = await deleteStoreDrink(id);
    if ("success" in res) {
      toast.success("Drink deleted");
      setDrinks((prev) => prev.filter((d) => d.id !== id));
    } else {
      toast.error(res.error);
    }
  };

  const handleDeleteCombo = async (id: string) => {
    const res = await deleteStoreCombo(id);
    if ("success" in res) {
      toast.success("Combo deleted");
      setCombos((prev) => prev.filter((c) => c.id !== id));
    } else {
      toast.error(res.error);
    }
  };

  const filteredDishes = dishes.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  const filteredDrinks = drinks.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  const filteredCombos = combos.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const renderList = (items: { id: string; name: string; price: number; imageUrl: string | null; isAvailable: boolean; tag?: string | null }[], type: "dish" | "drink" | "combo") => {
    if (items.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No {type === "combo" ? "combos" : `${type}s`} found. Click &quot;Add New&quot; to create one.
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="rounded-[1.5rem] border border-border/70 bg-card shadow-lg">
            <div className="aspect-video w-full overflow-hidden bg-muted">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} width={400} height={200} className="h-full w-full object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No Image</div>
              )}
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                {item.tag && <Badge variant="secondary" className="text-xs">{item.tag}</Badge>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">৳ {item.price}</span>
                <span className={`text-xs font-medium ${item.isAvailable ? "text-green-600" : "text-red-500"}`}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                  if (type === "dish") { setEditingDish(item as Dish); setDishEditOpen(true); }
                  else if (type === "drink") { setEditingDrink(item as Drink); setDrinkEditOpen(true); }
                  else { setEditingCombo(item as Combo); setComboEditOpen(true); }
                }}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => {
                  if (type === "dish") handleDeleteDish(item.id);
                  else if (type === "drink") handleDeleteDrink(item.id);
                  else handleDeleteCombo(item.id);
                }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Menu / Inventory Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your store&apos;s dishes, drinks, and combos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 max-w-xs" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 border-b">
          {(["dishes", "drinks", "combos"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "dishes" ? "Dishes" : t === "drinks" ? "Drinks" : "Combos"}
            </button>
          ))}
        </div>

        {tab === "dishes" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setDishCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Dish
              </Button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              renderList(filteredDishes, "dish")
            )}
          </div>
        )}

        {tab === "drinks" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setDrinkCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Drink
              </Button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              renderList(filteredDrinks, "drink")
            )}
          </div>
        )}

        {tab === "combos" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setComboCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Combo
              </Button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              renderList(filteredCombos, "combo")
            )}
          </div>
        )}
      </div>

      {dishCreateOpen && <CreateDishModal onClose={() => setDishCreateOpen(false)} onCreated={(dish) => { setDishes((prev) => [dish, ...prev]); setDishCreateOpen(false); toast.success("Dish created"); }} />}
      {dishEditOpen && editingDish && <EditDishModal dish={editingDish} onClose={() => { setDishEditOpen(false); setEditingDish(null); }} onUpdated={(dish) => { setDishes((prev) => prev.map((d) => d.id === dish.id ? dish : d)); setDishEditOpen(false); setEditingDish(null); toast.success("Dish updated"); }} />}
      {drinkCreateOpen && <CreateDrinkModal onClose={() => setDrinkCreateOpen(false)} onCreated={(drink) => { setDrinks((prev) => [drink, ...prev]); setDrinkCreateOpen(false); toast.success("Drink created"); }} />}
      {drinkEditOpen && editingDrink && <EditDrinkModal drink={editingDrink} onClose={() => { setDrinkEditOpen(false); setEditingDrink(null); }} onUpdated={(drink) => { setDrinks((prev) => prev.map((d) => d.id === drink.id ? drink : d)); setDrinkEditOpen(false); setEditingDrink(null); toast.success("Drink updated"); }} />}
      {comboCreateOpen && <CreateComboModal onClose={() => setComboCreateOpen(false)} onCreated={(combo) => { setCombos((prev) => [combo, ...prev]); setComboCreateOpen(false); toast.success("Combo created"); }} />}
      {comboEditOpen && editingCombo && <EditComboModal combo={editingCombo} onClose={() => { setComboEditOpen(false); setEditingCombo(null); }} onUpdated={(combo) => { setCombos((prev) => prev.map((c) => c.id === combo.id ? combo : c)); setComboEditOpen(false); setEditingCombo(null); toast.success("Combo updated"); }} />}
    </div>
  );
}
