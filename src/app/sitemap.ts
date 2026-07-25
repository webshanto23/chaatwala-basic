import { type MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://chaatwala-basic.vercel.app";

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/products/dishes`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/products/drinks`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/products/combos`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/license`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  try {
    const [dishes, drinks, combos] = await Promise.all([
      prisma.dish.findMany({ select: { id: true, updatedAt: true } }),
      prisma.drink.findMany({ select: { id: true, updatedAt: true } }),
      prisma.combo.findMany({ select: { id: true, updatedAt: true } }),
    ]);

    const productPages: MetadataRoute.Sitemap = [
      ...dishes.map((dish) => ({
        url: `${baseUrl}/products/dishes/${dish.id}`,
        lastModified: dish.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...drinks.map((drink) => ({
        url: `${baseUrl}/products/drinks/${drink.id}`,
        lastModified: drink.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...combos.map((combo) => ({
        url: `${baseUrl}/products/combos/${combo.id}`,
        lastModified: combo.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
