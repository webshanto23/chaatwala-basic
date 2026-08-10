"use client"

import { ProductImage } from "@/components/shared/ProductImage";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { useCart } from "@/features/cart/context"
import { useAuth } from "@/contexts/auth-context"

type Combo = {
  id: number
  name: string
  items: string[]
  price: number
  originalPrice: number
  image: string
}

export function ComboCard({ combo }: { combo: Combo }) {
  const discount = Math.round((1 - combo.price / combo.originalPrice) * 100)
  const { addItem } = useCart();
  const { auth } = useAuth();
  const isAdmin = auth.permissions.includes("admin:access");
  const isStoreManager = auth.permissions.includes("store:view");
  const disableCart = isAdmin || isStoreManager;

  return (
    <Card className="group rounded-[2rem] overflow-hidden border-0 bg-gradient-to-br from-white via-secondary/10 to-white shadow-lg shadow-secondary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative overflow-hidden">
        <div className="aspect-video w-full overflow-hidden">
          <ProductImage
            src={combo.image}
            alt={combo.name}
            width={400}
            height={224}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <Badge variant="popular" className="absolute top-3 right-3 rounded-full shadow-xl">
          {discount}% Off
        </Badge>
      </div>

      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{combo.name}</h3>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Includes:</p>
          <ul className="text-sm space-y-1 text-foreground/90">
            {combo.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <div>
            <span className="text-sm text-muted-foreground line-through">৳{combo.originalPrice}</span>
            <p className="text-2xl font-bold text-primary">৳{combo.price}</p>
          </div>
          <Button size="sm" className="h-10 rounded-full px-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => addItem({ productId: String(combo.id), productType: "combo", quantity: 1 })} disabled={disableCart}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
