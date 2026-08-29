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
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.9,
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
    const foods = await prisma.food.findMany({
      where: { isAvailable: true },
      select: { id: true, updatedAt: true, kind: true },
    });

    const productPages: MetadataRoute.Sitemap = [
      ...foods.map((food) => {
        return {
          url: `${baseUrl}/products/${food.id}`,
          lastModified: food.updatedAt,
          changeFrequency: food.kind === "COMBO" ? "weekly" as const : "daily" as const,
          priority: food.kind === "COMBO" ? 0.6 : 0.7,
        };
      }),
    ];

    return [...staticPages, ...productPages];
  } catch {
    return staticPages;
  }
}
