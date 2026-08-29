"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { updateStore } from "@/features/stores/actions";

type Store = {
  id: string;
  name: string;
  phone: string;
  address: string;
  imageUrl: string | null;
  managerId: string | null;
  manager: { id: string; name: string | null; username: string | null; email: string | null } | null;
  createdAt: string | Date;
};

type Manager = { id: string; name: string | null; username: string | null; email: string | null; storeIds: string[] };

type Toast = { id: number; type: "success" | "error"; message: string };

export function EditStoreModal({
  store,
  onClose,
  onUpdated,
  managers,
}: {
  store: Store;
  onClose: () => void;
  onUpdated?: (store: Store) => void;
  managers: Manager[];
}) {
  const [name, setName] = useState(store.name);
  const [phone, setPhone] = useState(store.phone);
  const [address, setAddress] = useState(store.address);
  const [managerId, setManagerId] = useState(store.managerId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const eligibleManagers = managers.filter((manager) => manager.storeIds.includes(store.id));

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
    fd.append("phone", phone);
    fd.append("address", address);
    if (managerId) fd.append("managerId", managerId);
    if (file) fd.append("image", file);

    const res = await updateStore(store.id, fd);
    setLoading(false);

    if ("error" in res) {
      pushToast("error", res.error);
      return;
    }

    pushToast("success", "Store updated successfully");
    onUpdated?.(res.store as Store);
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
          <CardTitle>Edit Store</CardTitle>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-image">Store Image</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {preview ? (
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  ) : store.imageUrl ? (
                    <img src={store.imageUrl} alt={store.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">No Image</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  id="store-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:inline-flex file:h-8 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input
                id="store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-phone">Phone Number</Label>
              <Input
                id="store-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-address">Address</Label>
              <Input
                id="store-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-manager">Store Manager</Label>
              <select
                id="store-manager"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">None added Yet</option>
                {eligibleManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.username ?? "Unnamed staff"}{m.email ? ` (${m.email})` : ""}
                  </option>
                ))}
              </select>
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
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

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
