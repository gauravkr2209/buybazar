import { NextRequest } from "next/server";
import { demoProducts } from "@/mocks/products";
import { databaseIsConfigured } from "@/lib/database-config";
import { apiError } from "@/lib/api-response";
import { getOfferDataState } from "@/lib/offer-state";
import { prisma } from "@/lib/prisma";

type ProductRouteProps = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: ProductRouteProps) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return apiError("Invalid product slug.", 400);
  }
  if (!databaseIsConfigured()) {
    const product = demoProducts.find((item) => item.slug === slug);
    if (!product) return apiError("Product not found.", 404);
    return Response.json({ dataStatus: "DEMO", product });
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      brand: true,
      variant: true,
      description: true,
      attributes: true,
      isDemo: true,
      category: { select: { name: true, slug: true } },
      offers: {
        orderBy: { price: "asc" },
        select: {
          id: true,
          price: true,
          currency: true,
          availability: true,
          isDemo: true,
          sourceName: true,
          sourceUrl: true,
          lastCheckedAt: true,
          freshnessExpiresAt: true,
          merchant: { select: { name: true } },
          observations: {
            orderBy: { observedAt: "desc" },
            take: 100,
            select: {
              id: true,
              price: true,
              currency: true,
              availability: true,
              isDemo: true,
              sourceName: true,
              sourceUrl: true,
              observedAt: true,
              freshnessExpiresAt: true,
            },
          },
        },
      },
    },
  });
  if (!product) {
    const demoProduct = demoProducts.find((item) => item.slug === slug);
    return demoProduct
      ? Response.json({ dataStatus: "DEMO", product: demoProduct })
      : apiError("Product not found.", 404);
  }
  return Response.json({
    product: {
      ...product,
      offers: product.offers.map((offer) => ({
        ...offer,
        price: offer.price.toFixed(2),
        dataFreshness: getOfferDataState(offer),
        observations: offer.observations.map((observation) => ({
          ...observation,
          price: observation.price.toFixed(2),
          dataFreshness: getOfferDataState(observation),
        })),
      })),
    },
  });
}
