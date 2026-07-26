"use client"

import { ProductImage } from "@/components/shared/ProductImage";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/features/cart/context"
import { useAuth } from "@/contexts/auth-context"

export default function CheckoutPage() {
  const { cart, total, isLoading } = useCart()
  const { auth } = useAuth()
  const [isPlacing, setIsPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!auth.isAuthenticated) {
    return (
      <>
        <meta name="robots" content="noindex, nofollow" />
        <div className="mx-auto px-4 py-10 max-w-7xl">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Checkout</h1>
          <p className="text-muted-foreground">Please sign in to checkout.</p>
        </div>
      </>
    )
  }

  const handlePlaceOrder = async () => {
    setIsPlacing(true)
    setError(null)
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ addressId: "default" }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to place order")
      }
      window.location.href = "/checkout/success"
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
        {/* Items */}
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

        {/* Summary */}
        <div className="w-full md:w-[360px]">
          <Card className="rounded-[1.5rem] border border-border/70 bg-white/95 shadow-xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>

              <Separator />

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
                disabled={isPlacing || cart.items.length === 0}
              >
                {isPlacing ? "Placing Order..." : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
}
