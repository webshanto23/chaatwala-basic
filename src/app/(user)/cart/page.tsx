"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

const initialCart = [
  {
    id: 1,
    name: "Pani Puri",
    price: 120,
    quantity: 2,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  },
  {
    id: 2,
    name: "Dahi Chaat",
    price: 150,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  },
  {
    id: 3,
    name: "Chicken Tikka",
    price: 150,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  },
  {
    id: 4,
    name: "Veggie Sandwich",
    price: 150,
    quantity: 4,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  },
]

export default function CartPage() {
  const [cart, setCart] = useState(initialCart)

  const updateQuantity = (id: number, type: "inc" | "dec") => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                type === "inc"
                  ? item.quantity + 1
                  : Math.max(1, item.quantity - 1),
            }
          : item
      )
    )
  }

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const total = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  )

  return (
    <div className=" mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      <div className="flex flex-col md:flex-row gap-4">
        
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.length === 0 && (
            <p className="text-muted-foreground">Your cart is empty.</p>
          )}

          {cart.map((item) => (
            <Card key={item.id} className="bg-card border-border hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-4">
                
                {/* Image */}
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded-md"
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
                      size="icon"
                      onClick={() => updateQuantity(item.id, "dec")}
                    >
                      -
                    </Button>

                    <span>{item.quantity}</span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, "inc")}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Remove */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Order Summary</h2>

              <Separator />

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳ {total}</span>
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

              <Button className="w-full mt-4">
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}