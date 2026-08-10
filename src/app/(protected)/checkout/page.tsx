"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProductImage } from "@/components/shared/ProductImage"
import { useCart } from "@/features/cart/context"
import { useAuth, useUserData } from "@/contexts/auth-context"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const AddressFormModal = dynamic(() => import("@/components/account/AddressFormModal").then(m => m.default), { ssr: false })

type ShippingAddress = {
  id: string
  fullName: string
  phone: string
  line1: string
  line2: string | null
  city: string
  postalCode: string
  country: string | null
  isDefault: boolean
}

type Store = { id: string; name: string; address: string }

export default function CheckoutPage() {
  const { cart, total, isLoading } = useCart()
  const { auth } = useAuth()
  const { addresses, isLoading: addressLoading, refresh } = useUserData()
  const [isPlacing, setIsPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [storeInvalid, setStoreInvalid] = useState(false)
  const [unavailableItems, setUnavailableItems] = useState<{ productId: string; productType: string; name: string }[]>([])

  useEffect(() => {
    if (!auth.isAuthenticated) {
      return
    }
    if (addresses.length === 0) {
      toast.info("Please add your address to start Ordering")
    }
  }, [auth.isAuthenticated, addresses])

  const defaultAddress = addresses.find((a: ShippingAddress) => a.isDefault) || addresses[0] || null
  const address = selectedAddressId
    ? addresses.find((a: ShippingAddress) => a.id === selectedAddressId) ?? defaultAddress
    : defaultAddress

  useEffect(() => {
    if (auth.isAuthenticated) {
      refresh()
    }
  }, [auth.isAuthenticated, refresh])

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/stores");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.stores?.length > 0) {
          setStores(data.stores);
          const saved = typeof window !== "undefined" ? localStorage.getItem("selectedStoreId") : null;
          if (saved && data.stores.some((s: Store) => s.id === saved)) {
            setSelectedStoreId(saved);
          }
        }
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (!selectedStoreId || cart.items.length === 0) {
      Promise.resolve().then(() => {
        setStoreInvalid(false);
        setUnavailableItems([]);
      });
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/cart/validate-store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId: selectedStoreId }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (!data.valid && data.unavailableItems?.length > 0) {
          setStoreInvalid(true);
          setUnavailableItems(data.unavailableItems);
        } else {
          setStoreInvalid(false);
          setUnavailableItems([]);
        }
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedStoreId, cart.items]);

  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const storeId = e.target.value || null;
    setSelectedStoreId(storeId);
    if (storeId) {
      localStorage.setItem("selectedStoreId", storeId);
    }
  };

  const handlePlaceOrder = async () => {
    if (!auth.isAuthenticated) {
      toast.error("Please sign in to checkout")
      return
    }

    if (!address) {
      toast.error("Please add a shipping address before checkout")
      setAddressModalOpen(true)
      return
    }

    if (!selectedStoreId) {
      toast.error("Please select a store before checkout")
      return
    }

    if (storeInvalid || cart.items.length === 0) {
      toast.error("Some items are unavailable at the selected store")
      return
    }

    setIsPlacing(true)
    setError(null)
    try {
      const idempotencyKey = crypto.randomUUID()
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          storeId: selectedStoreId,
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            postalCode: address.postalCode,
            country: address.country,
          },
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to initiate payment")
      }

      const data = await res.json()
      if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl
      } else {
        window.location.href = "/checkout/success"
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsPlacing(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <meta name="robots" content="noindex, nofollow" />
        <div className="mx-auto px-4 py-10 max-w-7xl">Loading cart...</div>
      </>
    )
  }

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="mx-auto px-4 py-10 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.length === 0 && (
              <p className="text-muted-foreground">Your cart is empty.</p>
            )}

            {cart.items.map((item) => (
              <Card key={item.id} className="group rounded-[1.5rem] overflow-hidden border-0 bg-gradient-to-br from-white via-secondary/10 to-white shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardContent className="flex items-center gap-4 p-4 md:p-5">
                  <ProductImage
                    src={item.imageUrl || "https://images.unsplash.com/photo-1603133872878-684f208fb84b"}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-[1rem]"
                  />
                  <div className="flex-1">
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="text-sm text-muted-foreground">৳ {item.price}</p>
                    <p className="text-sm text-muted-foreground mt-2">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">৳ {item.price * item.quantity}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="w-full md:w-[360px]">
            <Card className="rounded-[1.5rem] border border-border/70 bg-card shadow-xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Select Store</label>
                  <select
                    value={selectedStoreId ?? ""}
                    onChange={handleStoreChange}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">-- Choose a store --</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} — {store.address}
                      </option>
                    ))}
                  </select>
                </div>

                {storeInvalid && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {unavailableItems.map((item) => item.name).join(", ")} is Out of stock, Please wait or Select Another Store.
                  </div>
                )}

                {address ? (
                  <div
                    className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-1 cursor-pointer"
                    onClick={() => setAddressModalOpen(true)}
                  >
                    <p className="text-sm font-semibold text-foreground">Shipping Address</p>
                    <p className="text-sm text-muted-foreground">{address.fullName}</p>
                    <p className="text-sm text-muted-foreground">{address.phone}</p>
                    <p className="text-sm text-muted-foreground">{address.line1}</p>
                    {address.line2 && (
                      <p className="text-sm text-muted-foreground">{address.line2}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.postalCode}
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-center cursor-pointer"
                    onClick={() => setAddressModalOpen(true)}
                  >
                    <p className="text-sm text-muted-foreground">Please add your address to start Ordering</p>
                  </div>
                )}

                {addressLoading && !address && (
                  <p className="text-sm text-muted-foreground">Loading address...</p>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">৳ {total}</span>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery</span>
                  <span>৳ 50</span>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>৳ {total + 50}</span>
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button
                  className="w-full mt-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handlePlaceOrder}
                  disabled={isPlacing || cart.items.length === 0 || !address || !selectedStoreId || storeInvalid}
                >
                  {isPlacing ? "Processing Payment..." : "Proceed to Checkout"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {addressModalOpen && (
        <AddressFormModal
          address={address ?? undefined}
          onClose={() => setAddressModalOpen(false)}
          onSaved={(addr) => {
            setSelectedAddressId(addr.id)
            setAddressModalOpen(false)
            refresh()
          }}
        />
      )}
    </>
  )
}
