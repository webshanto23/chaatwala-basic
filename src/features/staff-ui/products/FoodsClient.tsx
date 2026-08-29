"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "@/components/staff/data-table";
import { FoodModal } from "@/components/staff/food-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/use-can";
import { createFoodCategory, createFoodTag, deleteFood, deleteFoodCategory, deleteFoodTag, type FoodResult } from "@/features/food/actions";
import type { FoodCatalogItem, FoodTaxonomy } from "@/features/food/queries";

function toFormFood(food: FoodCatalogItem): FoodResult {
  return {
    id: food.id, name: food.name, slug: food.slug, kind: food.kind, basePrice: food.basePrice,
    discountPercent: food.discountPercent, description: food.description, isAvailable: food.isAvailable,
    imageUrl: food.imageUrl, categoryIds: food.categories.map((category) => category.id),
    tagIds: food.tags.map((tag) => tag.id), componentFoodIds: food.componentFoodIds,
  };
}

export function FoodsClient({ initialFoods, taxonomy }: { initialFoods: FoodCatalogItem[]; taxonomy: FoodTaxonomy }) {
  const { can } = usePermissions();
  const [foods, setFoods] = useState(initialFoods);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"STANDARD" | "COMBO" | FoodResult | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [tagName, setTagName] = useState("");
  const [taxonomyState, setTaxonomyState] = useState(taxonomy);
  const [notice, setNotice] = useState("");
  const canCreate = can("food:create");
  const canUpdate = can("food:update");
  const canDelete = can("food:delete");
  const canManageCategories = can("food-category:manage");
  const canManageTags = can("food-tag:manage");

  const filteredFoods = useMemo(() => foods.filter((food) => food.name.toLowerCase().includes(query.trim().toLowerCase())), [foods, query]);
  const standardFoods = foods.filter((food) => food.kind === "STANDARD").map((food) => ({ id: food.id, name: food.name, finalPrice: food.finalPrice, isAvailable: food.isAvailable }));
  const rows = filteredFoods.map((food) => ({ id: food.id, name: food.name, type: food.kind === "COMBO" ? "Combo" : "Food", price: `$${food.finalPrice.toFixed(2)}`, categories: food.categories.map((category) => category.name).join(", ") || "-", available: food.isAvailable ? "Yes" : "No" }));

  function saveFood(saved: FoodResult) {
    const current = foods.find((food) => food.id === saved.id);
    const componentBase = saved.componentFoodIds.reduce((total, id) => total + (standardFoods.find((food) => food.id === id)?.finalPrice ?? 0), 0);
    const finalPrice = saved.kind === "STANDARD"
      ? saved.basePrice * (1 - saved.discountPercent / 100)
      : componentBase * (1 - saved.discountPercent / 100);
    const next: FoodCatalogItem = {
      ...(current ?? { finalPrice, categories: [], tags: [] }),
      ...saved,
      finalPrice,
      categories: saved.categoryIds.map((id) => taxonomyState.categories.find((category) => category.id === id)).filter(Boolean) as FoodCatalogItem["categories"],
      tags: saved.tagIds.map((id) => taxonomyState.tags.find((tag) => tag.id === id)).filter(Boolean) as FoodCatalogItem["tags"],
      componentFoodNames: saved.componentFoodIds.map((id) => standardFoods.find((food) => food.id === id)?.name ?? "Food"),
    };
    setFoods((items) => current ? items.map((item) => item.id === saved.id ? next : item) : [next, ...items]);
    setModal(null);
  }

  async function removeFood(id: string) {
    if (!confirm("Delete this food? This cannot be undone.")) return;
    const result = await deleteFood(id);
    if ("error" in result) { setNotice(result.error); return; }
    setFoods((items) => items.filter((item) => item.id !== id));
  }

  async function addTaxonomy(kind: "category" | "tag") {
    const name = kind === "category" ? categoryName : tagName;
    const result = kind === "category" ? await createFoodCategory(name) : await createFoodTag(name);
    if ("error" in result) { setNotice(result.error); return; }
    setTaxonomyState((current) => kind === "category"
      ? { ...current, categories: [...current.categories, result.item].sort((a, b) => a.name.localeCompare(b.name)) }
      : { ...current, tags: [...current.tags, result.item].sort((a, b) => a.name.localeCompare(b.name)) });
    setNotice(`${kind === "category" ? "Category" : "Tag"} created.`);
    if (kind === "category") setCategoryName(""); else setTagName("");
  }

  async function removeTaxonomy(kind: "category" | "tag", id: string) {
    const result = kind === "category" ? await deleteFoodCategory(id) : await deleteFoodTag(id);
    if ("error" in result) { setNotice(result.error); return; }
    setTaxonomyState((current) => kind === "category" ? { ...current, categories: current.categories.filter((item) => item.id !== id) } : { ...current, tags: current.tags.filter((item) => item.id !== id) });
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h1 className="text-2xl font-bold text-foreground md:text-3xl">Food catalog</h1><p className="text-muted-foreground">Manage standard foods, combos, categories, tags, and percentage discounts.</p></div><div className="flex gap-2">{canCreate && <><Button variant="outline" onClick={() => setModal("COMBO")}>New Combo</Button><Button onClick={() => setModal("STANDARD")}><Plus className="h-4 w-4" />New Food</Button></>}</div></div>
    {notice && <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm">{notice}</p>}
    <div className="flex justify-end"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search food..." className="max-w-xs" /></div>
    <DataTable columns={["Name", "Type", "Price", "Categories", "Available"]} data={rows} showActions={canUpdate || canDelete} onEdit={canUpdate ? (row) => { const food = foods.find((item) => item.id === row.id); if (food) setModal(toFormFood(food)); } : undefined} onDelete={canDelete ? (row) => removeFood(String(row.id)) : undefined} />
    {(canManageCategories || canManageTags) && <div className="grid gap-4 lg:grid-cols-2">
      {canManageCategories && <TaxonomyCard title="Categories" placeholder="New category" value={categoryName} onChange={setCategoryName} items={taxonomyState.categories} onAdd={() => addTaxonomy("category")} onDelete={(id) => removeTaxonomy("category", id)} />}
      {canManageTags && <TaxonomyCard title="Tags" placeholder="New tag" value={tagName} onChange={setTagName} items={taxonomyState.tags} onAdd={() => addTaxonomy("tag")} onDelete={(id) => removeTaxonomy("tag", id)} />}
    </div>}
    {modal && <FoodModal food={typeof modal === "object" ? modal : undefined} categories={taxonomyState.categories} tags={taxonomyState.tags} standardFoods={standardFoods} onClose={() => setModal(null)} onSaved={saveFood} />}
  </div>;
}

function TaxonomyCard({ title, placeholder, value, onChange, items, onAdd, onDelete }: { title: string; placeholder: string; value: string; onChange: (value: string) => void; items: { id: string; name: string }[]; onAdd: () => void; onDelete: (id: string) => void }) {
  return <Card><CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><Button type="button" onClick={onAdd}>Add</Button></div><div className="flex flex-wrap gap-2">{items.map((item) => <span key={item.id} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm">{item.name}<button type="button" aria-label={`Delete ${item.name}`} onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive">×</button></span>)}</div></CardContent></Card>;
}
