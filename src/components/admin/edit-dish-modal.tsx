"use client";

import { useEffect, useRef, useState } from "react";
import { X, ImagePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { updateDish } from "@/features/products/actions";

type Dish = {
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

type Toast = { id: number; type: "success" | "error"; message: string };

const TAGS = ["popular", "spicy", "new"] as const;
const MAX_DESCRIPTION = 100;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EditDishModal({
  dish,
  onClose,
  onUpdated,
}: {
  dish: Dish;
  onClose: () => void;
  onUpdated?: (dish: Dish) => void;
}) {
  const [name, setName] = useState(dish.name);
  const [slug, setSlug] = useState(dish.slug);
  const [price, setPrice] = useState(String(dish.price));
  const [discountPrice, setDiscountPrice] = useState(dish.discountPrice != null ? String(dish.discountPrice) : "");
  const [description, setDescription] = useState(dish.description ?? "");
  const [isAvailable, setIsAvailable] = useState(dish.isAvailable);
  const [tag, setTag] = useState(dish.tag ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastId = useRef(0);

  function pushToast(type: Toast["type"], message: string) {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(selected ? URL.createObjectURL(selected) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const fd = new FormData();
    fd.append("name", name);
    if (slug) fd.append("slug", slug);
    fd.append("price", price);
    if (discountPrice) fd.append("discountPrice", discountPrice);
    if (description) fd.append("description", description);
    fd.append("isAvailable", String(isAvailable));
    if (tag) fd.append("tag", tag);
    if (file) fd.append("image", file);

    const res = await updateDish(dish.id, fd);
    setLoading(false);

    if ("error" in res) {
      pushToast("error", res.error);
      return;
    }

    pushToast("success", "Dish updated successfully");
    onUpdated?.(res.dish as Dish);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Edit Dish</CardTitle>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Image */}
            <div className="space-y-2">
              <Label htmlFor="dish-image">Image</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  ) : dish.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dish.imageUrl} alt={dish.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  id="dish-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:inline-flex file:h-8 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="dish-name">Name</Label>
              <Input
                id="dish-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Pani Puri"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="dish-slug">Slug</Label>
              <Input
                id="dish-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-name"
              />
            </div>

            {/* Price + Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dish-price">Price</Label>
                <Input
                  id="dish-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dish-discount">Discount Price (optional)</Label>
                <Input
                  id="dish-discount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dish-description">Description</Label>
                <span className="text-xs text-muted-foreground">
                  {description.length}/{MAX_DESCRIPTION}
                </span>
              </div>
              <Textarea
                id="dish-description"
                value={description}
                maxLength={MAX_DESCRIPTION}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description (max 100 characters)"
              />
            </div>

            {/* Tag */}
            <div className="space-y-2">
              <Label htmlFor="dish-tag">Tag</Label>
              <select
                id="dish-tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">None</option>
                {TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Available toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="dish-available">Available</Label>
              <button
                id="dish-available"
                type="button"
                role="switch"
                aria-checked={isAvailable}
                onClick={() => setIsAvailable((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  isAvailable ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    isAvailable ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-2 text-sm shadow-md ${
              t.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
