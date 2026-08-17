import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

export async function getPublicStoresInfo() {
  return unstable_cache(
    async () => {
      return prisma.store.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          imageUrl: true,
        },
        orderBy: { name: "asc" },
      });
    },
    ["public-stores-info"],
    { revalidate: 300, tags: ["store-info"] }
  )();
}

export async function getStoreAvailabilities() {
  return unstable_cache(
    async () => {
      return prisma.store.findMany({
        select: {
          id: true,
          isOpen: true,
        },
      });
    },
    ["public-store-availability"],
    { revalidate: 60, tags: ["store-availability"] }
  )();
}
