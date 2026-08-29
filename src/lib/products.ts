import { getCalculatedFood } from "@/features/food/service";

export interface ProductInfo {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

export async function findProduct(productId: string): Promise<ProductInfo | null> {
  const food = await getCalculatedFood(productId);
  if (!food || !food.isAvailable) return null;
  return { id: food.id, name: food.name, price: food.finalPrice, imageUrl: food.imageUrl };
}

export function getEffectivePrice(product: ProductInfo) {
  return product.price;
}
