"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/use-can";

import dynamic from "next/dynamic";

const CreateStoreModal = dynamic(() => import("@/components/admin/create-store-modal").then(m => m.CreateStoreModal), { ssr: false });
const EditStoreModal = dynamic(() => import("@/components/admin/edit-store-modal").then(m => m.EditStoreModal), { ssr: false });

type Store = {
  id: string;
  name: string;
  phone: string;
  address: string;
  imageUrl: string | null;
  managerId: string | null;
  manager: { id: string; name: string | null; email: string } | null;
  createdAt: string | Date;
};

type Manager = { id: string; name: string | null; email: string };

export function StoresClient({ initialStores, initialManagers }: { initialStores: Store[]; initialManagers: Manager[] }) {
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [managers] = useState<Manager[]>(initialManagers);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const { can } = usePermissions();

  const canCreate = can("store:create");
  const canUpdate = can("store:update");

  const filtered = stores.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.address.toLowerCase().includes(q) ||
      (s.manager?.name ?? "").toLowerCase().includes(q)
    );
  });

  const handleCreated = (store: Store) => {
    setStores((prev) => [store, ...prev]);
  };

  const handleUpdated = (store: Store) => {
    setStores((prev) => prev.map((s) => (s.id === store.id ? store : s)));
  };

  const handleEdit = (store: Store) => {
    setSelectedStore(store);
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Stores</h1>
        <div className="flex items-center gap-3">
          <Input placeholder="Search stores..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" data-testid="admin-search" />
          {canCreate && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create Store
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/70">
          <CardContent className="p-6 text-center text-muted-foreground">No stores found.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((store) => (
            <Card key={store.id} className="border-border/70 overflow-hidden">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                {store.imageUrl ? (
                  <img src={store.imageUrl} alt={store.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No Image</div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{store.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Address:</span> {store.address}
                </div>
                <div>
                  <span className="font-medium text-foreground">Phone:</span> {store.phone}
                </div>
                <div>
                  <span className="font-medium text-foreground">Manager:</span>{" "}
                  {store.manager ? store.manager.name : "None added Yet"}
                </div>
              </CardContent>
              {canUpdate && (
                <div className="px-6 pb-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(store)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {open && <CreateStoreModal onClose={() => setOpen(false)} onCreated={handleCreated} managers={managers} />}
      {editOpen && selectedStore && (
        <EditStoreModal store={selectedStore} onClose={() => setEditOpen(false)} onUpdated={handleUpdated} managers={managers} />
      )}
    </div>
  );
}
