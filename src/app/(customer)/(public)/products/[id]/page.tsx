import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/products/product-detail/ProductDetailClient";
import { getFoodById, getFoodCatalog } from "@/features/food/queries";

export const revalidate = 300;

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const food = await getFoodById(id);
  if (!food || !food.isAvailable) notFound();

  const { foods: relatedFoods } = await getFoodCatalog({
    category: food.categories[0]?.slug,
    limit: 9,
  });
  const relatedProducts = relatedFoods
    .filter((item) => item.id !== food.id)
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: item.finalPrice,
      discountPrice: item.finalPrice < item.basePrice ? item.finalPrice : null,
      originalPrice: item.basePrice,
      imageUrl: item.imageUrl,
      tag: item.tags[0]?.name ?? null,
      items: item.kind === "COMBO" ? item.componentFoodNames : null,
    }));
  const price = food.finalPrice;
  const originalPrice = food.basePrice;
  const hasDiscount = originalPrice > price;

  return (
    <ProductDetailClient
      product={{
        id: food.id,
        name: food.name,
        type: food.kind === "COMBO" ? "combo" : "dish",
        price,
        discountPrice: hasDiscount ? price : null,
        originalPrice,
        description: food.description,
        isAvailable: food.isAvailable,
        imageUrl: food.imageUrl,
        tag: food.tags[0]?.name ?? null,
        storeId: null,
        items: food.kind === "COMBO" ? food.componentFoodNames : null,
      }}
      storeName={null}
      relatedProducts={relatedProducts}
      hasDiscount={hasDiscount}
      savingsPercent={hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : null}
      originalPrice={originalPrice}
    />
  );
}
