"use client";

import { useRouter } from "next/navigation";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string };

export function CatalogCategorySelector({ categories, selectedSlug }: { categories: Category[]; selectedSlug: string | null }) {
  const router = useRouter();
  const activeValue = selectedSlug ?? "all";
  const navigate = (value: string) => router.push(value === "all" ? "/products" : `/products?category=${encodeURIComponent(value)}`);

  return (
    <>
      <Tabs value={activeValue} onValueChange={navigate} className="hidden md:block">
        <TabsList className="h-auto max-w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
          <TabsTrigger value="all" className="rounded-full border border-border/70 bg-card/80 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All products</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.slug} className="rounded-full border border-border/70 bg-card/80 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{category.name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" className="w-full justify-between"><span>{selectedSlug ? categories.find((category) => category.slug === selectedSlug)?.name ?? "All products" : "All products"}</span><ListFilter className="h-4 w-4" /></Button></SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader><SheetTitle>Browse categories</SheetTitle></SheetHeader>
            <div className="grid gap-2 p-4 pt-0">
              {[{ id: "all", name: "All products", slug: "all" }, ...categories].map((category) => (
                <Button key={category.id} variant="outline" className={cn("justify-start", activeValue === category.slug && "border-primary bg-primary/10 text-primary")} onClick={() => navigate(category.slug)}>{category.name}</Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
