import { isFoodAvailableAtStore } from "@/features/food/service";

type CartFood = { productId: string; productType: string; name: string };

export async function getUnavailableCartItems(storeId: string, items: CartFood[]) {
  const availability = await Promise.all(items.map(async (item) => ({ item, available: item.productType === "food" && await isFoodAvailableAtStore(item.productId, storeId) })));
  return availability.filter(({ available }) => !available).map(({ item }) => item);
}
