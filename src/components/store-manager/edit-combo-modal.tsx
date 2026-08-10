"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus, ImagePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { updateStoreCombo } from "@/features/store-manager/actions";

type Combo = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  isAvailable: boolean;
  tag?: string | null;
  imageUrl: string | null;
  items: string[];
};

type Toast = { id: number; type: "success" | "error"; message: string };

const TAGS = ["popular", "new", "value"] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function EditComboModal({
  combo,
  onClose,
  onUpdated,
}: {
  combo: Combo;
  onClose: () => void;
  onUpdated?: (combo: Combo) => void;
}) {
  const [name, setName] = useState(combo.name);
  const [slug, setSlug] = useState("");
  const [items, setItems] = useState(combo.items.join(", "));
  const [price, setPrice] = useState(String(combo.price));
  const [originalPrice, setOriginalPrice] = useState(String(combo.originalPrice));
  const [isAvailable, setIsAvailable] = useState(combo.isAvailable);
  const [tag, setTag] = useState(combo.tag ?? "");
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
    Promise.resolve().then(() => {
      setSlug("");
    });
  }, [combo.id]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleNameChange(value: string) {
    setName(value);
    const generated = slugify(value);
    setSlug(generated);
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
    fd.append("items", items);
    fd.append("price", price);
    fd.append("originalPrice", originalPrice);
    fd.append("isAvailable", String(isAvailable));
    if (tag) fd.append("tag", tag);
    if (file) fd.append("image", file);

    const res = await updateStoreCombo(combo.id, fd);
    setLoading(false);

    if ("error" in res) {
      pushToast("error", res.error);
      return;
    }

    onUpdated?.(res.combo as Combo);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Edit Combo</CardTitle>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="combo-image">Image</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  ) : combo.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={combo.imageUrl} alt={combo.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <input ref={fileInputRef} id="combo-image" type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-muted-foreground file:mr-3 file:inline-flex file:h-8 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:text-primary-foreground hover:file:bg-primary/90" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="combo-name">Name</Label>
              <Input id="combo-name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Chaat Lover Combo" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="combo-slug">Slug</Label>
              <Input id="combo-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated-from-name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="combo-items">Items (comma-separated)</Label>
              <Input id="combo-items" value={items} onChange={(e) => setItems(e.target.value)} placeholder="e.g. Pani Puri, Bhel Puri, Dahi Puri" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="combo-price">Price</Label>
                <Input id="combo-price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="combo-original">Original Price</Label>
                <Input id="combo-original" type="number" step="0.01" min="0" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="0.00" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="combo-tag">Tag</Label>
              <select id="combo-tag" value={tag} onChange={(e) => setTag(e.target.value)} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">None</option>
                {TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="combo-available">Available</Label>
              <button id="combo-available" type="button" role="switch" aria-checked={isAvailable} onClick={() => setIsAvailable((v) => !v)} className={`relative h-6 w-11 rounded-full transition-colors ${isAvailable ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isAvailable ? "translate-x-5" : "translate-x-0.5"}`} />
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
                  <Plus className="h-4 w-4" /> Update Combo
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-lg border px-4 py-2 text-sm shadow-md ${t.type === "success" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
