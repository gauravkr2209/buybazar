import { NextRequest } from "next/server";
import { authIsConfigured } from "@/lib/auth";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/request-auth";

export async function GET() {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure the database and authentication before using watchlists.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to view your watchlist.", 401);

  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      product: {
        select: {
          slug: true,
          name: true,
          brand: true,
          variant: true,
          isDemo: true,
          category: { select: { name: true } },
        },
      },
    },
  });
  return Response.json({ items });
}

export async function POST(request: Request) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure the database and authentication before saving products.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to save products.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return apiError("Request body must be valid JSON.", 400);
    throw error;
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("slug" in body) ||
    typeof body.slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)
  ) {
    return apiError("Provide a valid product slug.", 400);
  }

  const product = await prisma.product.findUnique({
    where: { slug: body.slug },
    select: { id: true },
  });
  if (!product) return apiError("Product not found.", 404);

  const item = await prisma.watchlistItem.upsert({
    where: { userId_productId: { userId, productId: product.id } },
    update: {},
    create: { userId, productId: product.id },
    select: { id: true, createdAt: true },
  });
  return Response.json({ item }, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure the database and authentication before editing watchlists.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to edit your watchlist.", 401);

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return apiError("Provide a valid product slug.", 400);
  }
  const result = await prisma.watchlistItem.deleteMany({
    where: { userId, product: { slug } },
  });
  if (result.count === 0) return apiError("Saved product not found.", 404);
  return Response.json({ deleted: true });
}
