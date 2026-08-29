"use client";

import { ProductImage } from "@/components/shared/ProductImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Tag, Percent, PackageOpen } from "lucide-react";
import { useCart } from "@/features/cart/context";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

type RelatedProduct = {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  originalPrice: number | null;
  imageUrl: string | null;
  tag: string | null;
  items: string[] | null;
};

type Product = {
  type: "dish" | "drink" | "combo";
  data: {
    id: string;
    name: string;
    type: "dish" | "drink" | "combo";
    price: number;
    discountPrice: number | null;
    originalPrice: number | null;
    description: string | null;
    isAvailable: boolean;
    imageUrl: string | null;
    tag: string | null;
    storeId: string | null;
    items: string[] | null;
  };
};

type ProductDetailClientProps = {
  product: Product["data"];
  storeName: string | null;
  relatedProducts: RelatedProduct[];
  hasDiscount: boolean;
  savingsPercent: number | null;
  originalPrice: number;
};

export default function ProductDetailClient({
  product,
  storeName,
  relatedProducts,
  hasDiscount,
  savingsPercent,
  originalPrice,
}: ProductDetailClientProps) {
  const { addItem } = useCart();
  const { auth } = useAuth();
  const isAdmin = auth.role === "admin";
  const isStoreManager = auth.role === "store_manager";
  const disableCart = isAdmin || isStoreManager;

  const imageUrl = product.imageUrl || "/images/chatwala_logo.png";
  const price = product.discountPrice ?? product.price;
  const description = product.description || "No description available.";

  const comboItems = product.type === "combo" && product.items && product.items.length > 0 ? product.items : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/products">← Back to menu</Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-[2rem] bg-muted/30">
          <ProductImage
            src={imageUrl}
            alt={product.name}
            width={600}
            height={600}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            {product.tag && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {product.tag}
              </Badge>
            )}
            <Badge variant={product.isAvailable ? "default" : "outline"} className="flex items-center gap-1">
              <PackageOpen className="h-3 w-3" />
              {product.isAvailable ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>

          {storeName && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Store className="h-4 w-4" />
              <span>{storeName}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <p className="text-2xl font-semibold text-primary">
              ৳{price.toFixed(2)}
            </p>
            {hasDiscount && (
              <>
                <span className="text-lg line-through text-muted-foreground">
                  ৳{originalPrice.toFixed(2)}
                </span>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  {savingsPercent}% off
                </Badge>
              </>
            )}
          </div>

          {comboItems && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-1 text-sm font-medium text-foreground">Includes:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {comboItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-muted-foreground">{description}</p>

          <Button
            className="mt-4 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 md:w-auto"
            onClick={() =>
              addItem({ productId: product.id, productType: "food", quantity: 1 })
            }
            disabled={disableCart || !product.isAvailable}
          >
            {!product.isAvailable ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16 space-y-6">
          <h2 className="text-2xl font-bold text-foreground">You might also like</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((item) => {
              const itemPrice = item.discountPrice ?? item.price;
              const itemOriginal = item.originalPrice ?? item.price;
              const itemHasDiscount = itemOriginal > itemPrice;

              return (
                <Card key={item.id} className="rounded-[2rem] border-0 bg-card shadow-lg shadow-secondary/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <Link href={`/products/${item.id}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="aspect-video w-full overflow-hidden rounded-[1.5rem] bg-muted/30">
                        <ProductImage
                          src={item.imageUrl || "/images/chatwala_logo.png"}
                          alt={item.name}
                          width={400}
                          height={224}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">৳{itemPrice.toFixed(2)}</span>
                          {itemHasDiscount && (
                            <span className="text-xs line-through text-muted-foreground">৳{itemOriginal.toFixed(2)}</span>
                          )}
                        </div>
                        {item.tag && (
                          <Badge variant="secondary" className="text-xs">{item.tag}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
