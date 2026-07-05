import Link from "next/link";
import type { ReactNode } from "react";

const categories = [
  { href: "/products/combos", label: "Combos" },
  { href: "/products/dishes", label: "Dishes" },
  { href: "/products/drinks", label: "Drinks" },
];

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <section className="border-b bg-card/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
              Products
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Pick your favorite category
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Browse public combo deals, signature dishes, and refreshing drinks.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="rounded-full border border-border/70 px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                {category.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {children}
    </div>
  );
}
