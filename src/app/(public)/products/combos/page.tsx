import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ComboSection = dynamic(() => import("@/components/products/combos/ComboSection").then(m => m.ComboSection), {
  loading: () => (
    <section className="px-4 py-10 sm:px-6 lg:px-8 bg-gradient-to-br from-secondary/5 via-background to-primary/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] border border-border/70 bg-card/90 p-8 shadow-[0_32px_120px_-70px_rgba(59,130,246,0.25)] backdrop-blur-xl">
          <Skeleton className="mx-auto h-8 w-48 mb-2" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[2rem] border border-border/70 bg-card/90 p-6 space-y-3">
              <Skeleton className="aspect-square w-full rounded-[1.75rem]" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
});

export default function CombosPage() {
  return (
    <div className="flex flex-col flex-1 bg-background font-sans">
      <ComboSection />
    </div>
  );
}
