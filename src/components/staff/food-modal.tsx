"use client";

import { useState } from "react";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { createComboFood, createStandardFood, updateFood, type FoodResult } from "@/features/food/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Taxonomy = { id: string; name: string; slug: string };
type StandardFood = { id: string; name: string; finalPrice: number; isAvailable: boolean };

export function FoodModal({
  food, categories, tags, standardFoods, onClose, onSaved,
}: {
  food?: FoodResult;
  categories: Taxonomy[];
  tags: Taxonomy[];
  standardFoods: StandardFood[];
  onClose: () => void;
  onSaved: (food: FoodResult) => void;
}) {
  const kind = food?.kind ?? "STANDARD";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(food?.imageUrl ?? null);
  const [categoryIds, setCategoryIds] = useState<string[]>(food?.categoryIds ?? []);
  const [tagIds, setTagIds] = useState<string[]>(food?.tagIds ?? []);
  const [componentFoodIds, setComponentFoodIds] = useState<string[]>(food?.componentFoodIds ?? []);
  const [isAvailable, setIsAvailable] = useState(food?.isAvailable ?? true);

  function toggle(value: string, values: string[], setValues: (value: string[]) => void) {
    setValues(values.includes(value) ? values.filter((id) => id !== value) : [...values, value]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    formData.set("categoryIds", JSON.stringify(categoryIds));
    formData.set("tagIds", JSON.stringify(tagIds));
    formData.set("componentFoodIds", JSON.stringify(componentFoodIds));
    formData.set("isAvailable", String(isAvailable));
    const result = food ? await updateFood(food.id, formData) : kind === "COMBO" ? await createComboFood(formData) : await createStandardFood(formData);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(result.food);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{food ? `Edit ${kind === "COMBO" ? "combo" : "food"}` : `New ${kind === "COMBO" ? "combo" : "food"}`}</CardTitle>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-5">
            {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="food-name">Name</Label><Input id="food-name" name="name" defaultValue={food?.name} required /></div>
              <div className="space-y-2"><Label htmlFor="food-slug">Slug</Label><Input id="food-slug" name="slug" defaultValue={food?.slug} placeholder="auto-generated-from-name" /></div>
              {kind === "STANDARD" && <div className="space-y-2"><Label htmlFor="food-price">Base price</Label><Input id="food-price" name="basePrice" type="number" min="0.01" step="0.01" defaultValue={food?.basePrice} required /></div>}
              <div className="space-y-2"><Label htmlFor="food-discount">Discount (%)</Label><Input id="food-discount" name="discountPercent" type="number" min="0" max="100" step="0.01" defaultValue={food?.discountPercent ?? 0} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="food-description">Description</Label><Textarea id="food-description" name="description" maxLength={500} defaultValue={food?.description ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="food-image">Image (optional)</Label><div className="flex items-center gap-3">{preview ? <img src={preview} alt="Food preview" className="h-16 w-16 rounded-md object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted"><ImagePlus className="h-5 w-5 text-muted-foreground" /></div>}<Input id="food-image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)); }} /></div></div>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">Categories</legend><div className="flex flex-wrap gap-3">{categories.map((category) => <Label key={category.id} className="flex items-center gap-2 text-sm font-normal"><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={() => toggle(category.id, categoryIds, setCategoryIds)} />{category.name}</Label>)}</div></fieldset>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">Tags</legend><div className="flex flex-wrap gap-3">{tags.map((tag) => <Label key={tag.id} className="flex items-center gap-2 text-sm font-normal"><input type="checkbox" checked={tagIds.includes(tag.id)} onChange={() => toggle(tag.id, tagIds, setTagIds)} />{tag.name}</Label>)}</div></fieldset>
            {kind === "COMBO" && <div className="space-y-2"><Label htmlFor="combo-components">Components (choose 2–3 standard foods)</Label><select id="combo-components" multiple value={componentFoodIds} onChange={(event) => setComponentFoodIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))} className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{standardFoods.map((item) => <option key={item.id} value={item.id} disabled={!item.isAvailable}>{item.name} — ${item.finalPrice.toFixed(2)}{item.isAvailable ? "" : " (unavailable)"}</option>)}</select></div>}
            <Label className="flex items-center gap-2 text-sm font-normal"><input type="checkbox" checked={isAvailable} onChange={(event) => setIsAvailable(event.target.checked)} />Available for sale</Label>
          </CardContent>
          <CardFooter className="justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Plus className="h-4 w-4" />{food ? "Save changes" : "Create"}</>}</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}
