import prisma from "@/lib/prisma";

type ProductType = "dish" | "drink" | "combo";

type CartProduct = {
  productId: string;
  productType: string;
  name: string;
};

type UnavailableItem = {
  productId: string;
  productType: string;
  name: string;
};

export async function getUnavailableCartItems(
  storeId: string,
  items: CartProduct[]
): Promise<UnavailableItem[]> {
  const productIds = {
    dish: items.filter((item) => item.productType === "dish").map((item) => item.productId),
    drink: items.filter((item) => item.productType === "drink").map((item) => item.productId),
    combo: items.filter((item) => item.productType === "combo").map((item) => item.productId),
  };

  const inventoryFilters = (Object.entries(productIds) as [ProductType, string[]][])
    .filter(([, ids]) => ids.length > 0)
    .map(([productType, ids]) => ({ productType, productId: { in: ids } }));

  const [dishes, drinks, combos, inventory] = await Promise.all([
    productIds.dish.length
      ? prisma.dish.findMany({
          where: { id: { in: productIds.dish }, isAvailable: true },
          select: { id: true, storeId: true },
        })
      : Promise.resolve([]),
    productIds.drink.length
      ? prisma.drink.findMany({
          where: { id: { in: productIds.drink }, isAvailable: true },
          select: { id: true, storeId: true },
        })
      : Promise.resolve([]),
    productIds.combo.length
      ? prisma.combo.findMany({
          where: { id: { in: productIds.combo }, isAvailable: true },
          select: { id: true, storeId: true },
        })
      : Promise.resolve([]),
    inventoryFilters.length
      ? prisma.storeInventory.findMany({
          where: { storeId, OR: inventoryFilters },
          select: { productType: true, productId: true, isAvailable: true },
        })
      : Promise.resolve([]),
  ]);

  const products = new Map<string, { storeId: string | null }>([
    ...dishes.map((product) => [`dish:${product.id}`, product] as const),
    ...drinks.map((product) => [`drink:${product.id}`, product] as const),
    ...combos.map((product) => [`combo:${product.id}`, product] as const),
  ]);
  const inventoryByProduct = new Map(
    inventory.map((item) => [`${item.productType}:${item.productId}`, item.isAvailable])
  );

  return items.filter((item) => {
    if (item.productType !== "dish" && item.productType !== "drink" && item.productType !== "combo") {
      return true;
    }

    const key = `${item.productType}:${item.productId}`;
    const product = products.get(key);
    if (!product) return true;

    if (product.storeId === storeId) return false;
    if (product.storeId != null) return true;

    return inventoryByProduct.get(key) === false;
  });
}
