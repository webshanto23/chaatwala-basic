"use client";

import { useEffect, useState } from "react";
import { MapPin, PencilLine, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import type { Address } from "@/features/address/actions";
import { useUserData } from "@/contexts/auth-context";

const AddressFormModal = dynamic(() => import("@/components/account/AddressFormModal").then(m => m.default), { ssr: false });

export function AddressList() {
  const { addresses, isLoading, refresh } = useUserData();
  const [editAddress, setEditAddress] = useState<Address | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSaved = async (_address: Address) => {
    await refresh();
    toast.success("Address saved successfully");
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/user/address/${id}`, { method: "DELETE" });
    toast.success("Address deleted");
    await refresh();
  };

  if (isLoading) {
    return (
      <Card className="rounded-[2rem] border border-border/70 bg-card shadow-xl">
        <CardContent className="p-6 text-center text-muted-foreground">Loading addresses...</CardContent>
      </Card>
    );
  }

  if (addresses.length === 0) {
    return (
      <Card className="rounded-[2rem] border border-border/70 bg-card shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between px-6 pb-2 pt-6">
          <CardTitle className="text-base">Addresses</CardTitle>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setEditAddress(null); setModalOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <p className="text-sm text-muted-foreground text-center py-4">Please add your address to start Ordering</p>
        </CardContent>
        {modalOpen && (
          <AddressFormModal onClose={() => setModalOpen(false)} onSaved={handleSaved} />
        )}
      </Card>
    );
  }

  return (
    <Card className="rounded-[2rem] border border-border/70 bg-card shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between px-6 pb-2 pt-6">
        <CardTitle className="text-base">Addresses</CardTitle>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setEditAddress(null); setModalOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="rounded-2xl border border-border/70 bg-muted/50 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{address.fullName}</p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <p className="text-sm text-muted-foreground">{address.line1}</p>
                {address.line2 && <p className="text-sm text-muted-foreground">{address.line2}</p>}
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.postalCode}
                </p>
                {address.isDefault && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground mt-1 inline-block">
                    Default
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setEditAddress(address); setModalOpen(true); }}>
                <PencilLine className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleDelete(address.id)}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
      {modalOpen && (
        <AddressFormModal address={editAddress} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}
    </Card>
  );
}
