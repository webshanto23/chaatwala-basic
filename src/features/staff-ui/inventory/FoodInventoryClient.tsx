"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setFoodStoreAvailability } from "@/features/food/actions";
import type { FoodCatalogItem } from "@/features/food/queries";

export function FoodInventoryClient({ initialFoods }: { initialFoods: FoodCatalogItem[] }) {
  const [foods, setFoods] = useState(initialFoods);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => foods.filter((food) => food.name.toLowerCase().includes(query.toLowerCase())), [foods, query]);

  async function toggle(food: FoodCatalogItem) {
    const result = await setFoodStoreAvailability(food.id, !food.isAvailable);
    if ("error" in result) { toast.error(result.error); return; }
    setFoods((items) => items.map((item) => item.id === food.id ? { ...item, isAvailable: !item.isAvailable } : item));
    toast.success("Store availability updated");
  }

  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-foreground md:text-3xl">Store inventory</h1><p className="text-muted-foreground">Control availability for your assigned primary store.</p></div><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search food..." className="max-w-xs" /><div className="overflow-x-auto rounded-lg border border-border bg-card"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Food</th><th className="p-3">Type</th><th className="p-3">Price</th><th className="p-3">Availability</th></tr></thead><tbody>{visible.map((food) => <tr className="border-b last:border-0" key={food.id}><td className="p-3 font-medium">{food.name}</td><td className="p-3">{food.kind === "COMBO" ? "Combo" : "Food"}</td><td className="p-3">৳{food.finalPrice.toFixed(2)}</td><td className="p-3"><Button variant={food.isAvailable ? "outline" : "destructive"} size="sm" onClick={() => toggle(food)}>{food.isAvailable ? "Available" : "Unavailable"}</Button></td></tr>)}</tbody></table></div></div>;
}
