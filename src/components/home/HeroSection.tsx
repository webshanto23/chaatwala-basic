import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StoreButton } from "@/components/home/StoreButton";
import {
  getPublicStoresInfo,
  getStoreAvailabilities,
} from "@/features/stores/service";

export async function HeroSection() {
  const [stores, availabilities] = await Promise.all([
    getPublicStoresInfo(),
    getStoreAvailabilities(),
  ]);

  const availabilityMap = new Map(availabilities.map((a) => [a.id, a.isOpen]));
  const storesWithAvailability = stores.map((s) => ({
    ...s,
    isOpen: availabilityMap.get(s.id) ?? true,
  }));
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 `bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.12),transparent_25%)]`" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6">
            <Badge
              variant="popular"
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary shadow-lg shadow-primary/10 px-4 py-2 text-sm font-semibold"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Street Food Delivered Fresh
            </Badge>

            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Discover bold street flavors{" "}
              <span className="text-primary">that excite</span>
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Chaatwala brings vibrant Indian street food to your table with
              colorful flavors, crispy textures, and fast delivery.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90"
              >
                <Link href="/cart">Order Now</Link>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card text-foreground shadow-lg hover:bg-card/80"
              >
                <Link href="/products/dishes">Explore Menu</Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 max-w-2xl">
              <div className="rounded-3xl border border-border/70 bg-card/80 p-4 text-center shadow-sm">
                <p className="text-3xl font-semibold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Chaat Varieties</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card/80 p-4 text-center shadow-sm">
                <p className="text-3xl font-semibold text-secondary">15 min</p>
                <p className="text-sm text-muted-foreground">Avg Delivery</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card/80 p-4 text-center shadow-sm">
                <p className="text-3xl font-semibold text-accent">4.8★</p>
                <p className="text-sm text-muted-foreground">Customer rating</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
            <div className="absolute -right-8 bottom-0 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
            <div className="isolate overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-[0_32px_120px_-58px_rgba(251,140,0,0.55)]">
              <div className="aspect-[4/3] w-full overflow-hidden">
                <Image
                  src="/og-image.svg"
                  alt="Delicious street food spread"
                  width={630}
                  height={480}
                  className="h-full w-full object-fit transition-transform duration-700 hover:scale-105"
                />
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-center rounded-3xl bg-primary/10 px-4 py-3 text-sm text-primary shadow-inner shadow-primary/10">
                  <div className="space-y-1 text-center">
                    <p className="font-semibold">Authentic Foods</p>
                    <p className="text-xs text-muted-foreground">
                      Industry-leading chefs and recipes curated for you!
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {storesWithAvailability.map((store) => (
                    <StoreButton key={store.id} store={store} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
