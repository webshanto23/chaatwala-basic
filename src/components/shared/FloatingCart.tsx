"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Plus, Minus } from "lucide-react"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

export function FloatingCart() {
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, name: "Pani Puri", price: 120, quantity: 2 },
    { id: 2, name: "Lassi", price: 80, quantity: 1 },
  ])
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          size="lg" 
          className="fixed bottom-20 right-4 rounded-full shadow-2xl z-50 h-14 w-14 md:hidden flex items-center justify-center hover:scale-110 transition-transform"
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:w-96 bg-card p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-foreground">Your Cart</h2>
            <p className="text-sm text-muted-foreground">{totalItems} items</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">৳{total}</span>
            </div>
            <Button className="w-full h-12 text-base font-medium" size="lg">
              Checkout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function CartItem({ item }: { item: CartItem }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-background border border-border">
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <img 
          src="https://images.unsplash.com/photo-1603133872878-684f208fb84b" 
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-1 text-foreground">{item.name}</h4>
        <p className="text-primary font-semibold text-sm">৳{item.price}</p>
        
        <div className="flex items-center gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 w-7 rounded-full p-0"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-sm font-medium">{item.quantity}</span>
          <Button 
            size="sm" 
            className="h-7 w-7 rounded-full p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}