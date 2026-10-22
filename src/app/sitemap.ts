import type { MetadataRoute } from "next";
import { categorySlug, demoProducts, productCategories } from "@/mocks/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.SITE_URL;
  if (!origin) return [];

  const base = new URL(origin);
  if (process.env.NODE_ENV === "production" && base.protocol !== "https:") {
    throw new Error("SITE_URL must use HTTPS in production.");
  }

  const urls = [
    { url: base.toString(), changeFrequency: "weekly" as const, priority: 1 },
    ...productCategories.map((category) => ({
      url: new URL(`/category/${categorySlug(category)}`, base).toString(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...demoProducts.map((product) => ({
      url: new URL(`/products/${product.slug}`, base).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
  return urls;
}
