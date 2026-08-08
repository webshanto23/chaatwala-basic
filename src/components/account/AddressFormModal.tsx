"use client";

import { useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { createAddress, updateAddress } from "@/features/address/actions";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string | null;
  isDefault: boolean;
};

type Toast = { id: number; type: "success" | "error"; message: string };

type AddressFormModalProps = {
  address?: Address | null;
  onClose: () => void;
  onSaved: (address: Address) => void;
};

export default function AddressFormModal({ address, onClose, onSaved }: AddressFormModalProps) {
  const [fullName, setFullName] = useState(address?.fullName ?? "");
  const [phone, setPhone] = useState(address?.phone ?? "");
  const [line1, setLine1] = useState(address?.line1 ?? "");
  const [line2, setLine2] = useState(address?.line2 ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [postalCode, setPostalCode] = useState(address?.postalCode ?? "");
  const [_country] = useState(address?.country ?? "BD");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  function pushToast(type: Toast["type"], message: string) {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    let shouldClose = false;

    try {
      const input = {
        fullName,
        phone,
        line1,
        line2: line2 || undefined,
        city,
        postalCode,
        country: _country,
      };

      const res = address ? await updateAddress(address.id, input) : await createAddress(input);

      if ("error" in res) {
        pushToast("error", res.error);
        return;
      }

      pushToast("success", address ? "Address updated" : "Address added");
      onSaved(res.address);
      shouldClose = true;
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setLoading(false);
    }

    if (shouldClose) {
      onClose();
    }
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
          <CardTitle>{address ? "Edit Address" : "Add Address"}</CardTitle>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line1">Address Line 1</Label>
              <Input id="line1" value={line1} onChange={(e) => setLine1(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line2">Address Line 2 (optional)</Label>
              <Input id="line2" value={line2 ?? ""} onChange={(e) => setLine2(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
              </div>
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
                <>{address ? "Save Changes" : "Add Address"}</>
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
