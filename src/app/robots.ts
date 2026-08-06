export const runtime = "edge";

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://chaatwala-basic.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/cart", "/checkout", "/profile"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
