"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductImage } from "@/components/shared/ProductImage";
import { useCart } from "@/features/cart/context";
import { useAuth, useUserData } from "@/contexts/auth-context";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const AddressFormModal = dynamic(() => import("@/components/account/AddressFormModal").then(m => m.default), { ssr: false });

export default function CartPage() {
  const router = useRouter();
  const { cart, total, updateQuantity, removeItem, isLoading } = useCart();
  const { auth } = useAuth();
  const { addresses, isLoading: addressLoading, refresh } = useUserData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const toastShown = useRef(false);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    if (addresses.length === 0 && !toastShown.current) {
      toastShown.current = true;
      toast.info("Please add your address to start Ordering");
    }
  }, [auth.isAuthenticated, addresses]);

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;
  const shippingAddress = selectedAddressId
    ? addresses.find((a) => a.id === selectedAddressId) ?? defaultAddress
    : defaultAddress;

  useEffect(() => {
    if (auth.isAuthenticated) {
      refresh();
    }
  }, [auth.isAuthenticated, refresh]);

  const handleProceedToPayment = async () => {
    if (!auth.isAuthenticated) {
      router.push("/sign-in?redirect=/cart");
      return;
    }

    if (!shippingAddress) {
      toast.error("Please add a shipping address before checkout");
      setAddressModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          shippingAddress: {
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initiate payment");
      }
      const data = await res.json();
      if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      } else {
        router.push("/checkout");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="mx-auto px-4 py-10 max-w-7xl">Loading cart...</div>;
  }

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="mx-auto px-4 py-10 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Your Cart</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.length === 0 && (
              <p className="text-muted-foreground">Your cart is empty.</p>
            )}

            {cart.items.map((item) => (
              <Card
                key={item.id}
                className="group rounded-[1.5rem] overflow-hidden border border-border/70 bg-card shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <CardContent className="flex items-center gap-4 p-4 md:p-5">
                  <ProductImage
                    src={item.imageUrl || "/images/chatwala-logo.png"}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-[1rem]"
                  />

                  <div className="flex-1">
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="text-sm text-muted-foreground">৳ {item.price}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-full"
                        onClick={async () => {
                          if (item.quantity <= 1) {
                            await removeItem(item.id);
                          } else {
                            await updateQuantity(item.id, item.quantity - 1);
                          }
                        }}
                      >
                        -
                      </Button>

                      <span className="w-8 text-center">{item.quantity}</span>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="ml-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-full"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="w-full md:w-[360px]">
            <Card className="rounded-[1.5rem] border border-border/70 bg-card shadow-xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>

                <Separator />

                {shippingAddress ? (
                  <div
                    className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-1 cursor-pointer"
                    onClick={() => setAddressModalOpen(true)}
                  >
                    <p className="text-sm font-semibold text-foreground">Shipping Address</p>
                    <p className="text-sm text-muted-foreground">{shippingAddress.fullName}</p>
                    <p className="text-sm text-muted-foreground">{shippingAddress.phone}</p>
                    <p className="text-sm text-muted-foreground">{shippingAddress.line1}</p>
                    {shippingAddress.line2 && (
                      <p className="text-sm text-muted-foreground">{shippingAddress.line2}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {shippingAddress.city}, {shippingAddress.postalCode}
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

                {addressLoading && !shippingAddress && (
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
                  onClick={handleProceedToPayment}
                  disabled={isProcessing || cart.items.length === 0 || !shippingAddress}
                >
                  {isProcessing ? "Processing..." : "Proceed to Checkout"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {addressModalOpen && (
        <AddressFormModal
          address={shippingAddress ?? undefined}
          onClose={() => setAddressModalOpen(false)}
          onSaved={(address) => {
            setSelectedAddressId(address.id);
            setAddressModalOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
