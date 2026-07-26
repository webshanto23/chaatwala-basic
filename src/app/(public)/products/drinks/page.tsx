import { PopularDrinks } from "@/components/products/drinks/PopularDrinks";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const revalidate = 300;

const AllDrinks = dynamic(() => import("@/components/products/drinks/AllDrinks").then(m => m.AllDrinks), {
  loading: () => (
    <section className="px-4 py-10 md:px-6 lg:px-8 bg-gradient-to-br from-secondary/5 via-background to-primary/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-border/70 bg-card/90 p-8 text-center shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          <Skeleton className="mx-auto h-8 w-48 mb-2" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 w-56 space-y-3">
              <Skeleton className="aspect-square w-full rounded-[2rem]" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
});

export default function DrinksPage() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <PopularDrinks />
      <AllDrinks />
    </div>
  );
}
