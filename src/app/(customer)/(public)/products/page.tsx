import { CatalogCategorySelector } from "@/components/products/CatalogCategorySelector";
import { FoodCatalogGrid } from "@/components/products/FoodCatalogGrid";
import { getFoodCatalog, getFoodTaxonomy } from "@/features/food/queries";

export const revalidate = 300;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category: requestedCategory } = await searchParams;
  const taxonomy = await getFoodTaxonomy();
  const selectedCategory = taxonomy.categories.find((category) => category.slug === requestedCategory) ?? null;
  const { foods } = await getFoodCatalog({ category: selectedCategory?.slug, limit: 100 });

  return (
    <div className="flex flex-1 flex-col bg-linear-to-r from-primary/10 via-secondary/10 to-accent/10 font-sans">
      <section>
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-secondary">Menu</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Find your favorite food</h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">Browse the menu by the categories created by our team.</p>
          </div>
          <CatalogCategorySelector categories={taxonomy.categories} selectedSlug={selectedCategory?.slug ?? null} />
        </div>
      </section>
      <section className="px-4 pb-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><FoodCatalogGrid foods={foods} /></div></section>
    </div>
  );
}
