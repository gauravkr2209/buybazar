import { NextRequest } from "next/server";
import { demoProducts } from "@/mocks/products";
import { apiError } from "@/lib/api-response";
import { databaseIsConfigured } from "@/lib/database-config";
import { getLiveProduct } from "@/lib/firestore-products";

type ProductRouteProps = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: ProductRouteProps) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return apiError("Invalid product slug.", 400);
  }
  const liveProduct = databaseIsConfigured() ? await getLiveProduct(slug) : null;
  if (liveProduct) return Response.json({ product: liveProduct });

  const demoProduct = demoProducts.find((item) => item.slug === slug);
  return demoProduct
    ? Response.json({ dataStatus: "DEMO", product: demoProduct })
    : apiError("Product not found.", 404);
}
