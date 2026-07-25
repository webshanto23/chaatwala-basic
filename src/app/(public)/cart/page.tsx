"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { useCart } from "@/features/cart/context"

export default function CartPage() {
  const router = useRouter()
  const { cart, total, updateQuantity, removeItem, isLoading } = useCart()

  if (isLoading) {
    return <div className="mx-auto px-4 py-10 max-w-7xl">Loading cart...</div>
  }

  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Your Cart</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.length === 0 && (
            <p className="text-muted-foreground">Your cart is empty.</p>
          )}

          {cart.items.map((item) => (
            <Card key={item.id} className="group rounded-[1.5rem] overflow-hidden border border-border/70 bg-card shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardContent className="flex items-center gap-4 p-4 md:p-5">
                {/* Image */}
                <Image
                  src={item.imageUrl || "https://images.unsplash.com/photo-1603133872878-684f208fb84b"}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded-[1rem]"
                />

                {/* Info */}
                <div className="flex-1">
                  <h2 className="font-semibold">{item.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    ৳ {item.price}
                  </p>

                  {/* Quantity */}
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

                {/* Remove */}
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

              <Button
                className="w-full mt-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/checkout")}
              >
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
