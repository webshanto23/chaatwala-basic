import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/ProductCard";
import Link from "next/link";

export type FoodItem = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discountPrice: number | null;
  rating: number;
  image: string;
  detail: string;
  tag?: "spicy" | "popular" | "new";
};

interface SignatureSectionProps {
  title: string;
  items: FoodItem[];
  color?: "primary" | "secondary" | "accent";
}

export function SignatureSection({ title, items }: SignatureSectionProps) {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative max-w-7xl mx-auto overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_32px_90px_-48px_rgba(245,158,11,0.25)]">
        <div className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute left-8 top-20 h-44 w-44 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-secondary">
              Signature picks
            </p>
            <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
              {title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full border border-primary/15 bg-card/80 text-primary shadow-sm hover:bg-card"
          >
            <Link href="/products">View All</Link>
          </Button>
        </div>

        <div className="flex gap-5 flex-wrap justify-center md:justify-start">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              image={item.image}
              name={item.name}
              price={item.price}
              originalPrice={item.originalPrice}
              discountPrice={item.discountPrice}
              detail={item.detail}
              rating={item.rating}
              tag={item.tag}
              productType="food"
              href={`/products/${item.id}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
