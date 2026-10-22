import { NextRequest } from "next/server";
import { categorySlug, demoProducts, productCategories } from "@/mocks/products";
import { apiError } from "@/lib/api-response";
import { databaseIsConfigured } from "@/lib/database-config";
import { getOfferDataState } from "@/lib/offer-state";
import { prisma } from "@/lib/prisma";

function parsePrice(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value)) return NaN;
  return Number(value);
}

function fallbackProducts(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim().toLocaleLowerCase("en-IN");
  const category = params.get("category");
  const brand = params.get("brand") ?? "";
  const minimum = parsePrice(params.get("minPrice"));
  const maximum = parsePrice(params.get("maxPrice"));
  const sort = params.get("sort") ?? "recommended";
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "24");
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50
  ) {
    return apiError("page must be positive and pageSize must be between 1 and 50.", 400);
  }
  if (
    Number.isNaN(minimum) ||
    Number.isNaN(maximum) ||
    (minimum !== undefined && maximum !== undefined && minimum > maximum)
  ) {
    return apiError("Provide a valid INR price range.", 400);
  }
  if (category && !productCategories.some((name) => categorySlug(name) === category)) {
    return apiError("Unknown product category.", 400);
  }
  const products = demoProducts.filter((product) => {
    const price = Math.min(...product.offers.map((offer) => offer.price));
    const searchable = [
      product.name,
      product.brand,
      product.category,
      product.variant,
      ...product.specifications,
    ].join(" ").toLocaleLowerCase("en-IN");
    return (
      (!query || searchable.includes(query)) &&
      (!category || categorySlug(product.category) === category) &&
      (!brand || product.brand === brand) &&
      (minimum === undefined || price >= minimum) &&
      (maximum === undefined || price <= maximum)
    );
  });
  if (sort === "name") products.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "price-ascending" || sort === "price-descending") {
    const direction = sort === "price-ascending" ? 1 : -1;
    products.sort((a, b) => {
      const aPrice = Math.min(...a.offers.map((offer) => offer.price));
      const bPrice = Math.min(...b.offers.map((offer) => offer.price));
      return (aPrice - bPrice) * direction;
    });
  }
  return Response.json({
    dataStatus: "DEMO",
    products: products.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: products.length,
  });
}

export async function GET(request: NextRequest) {
  if (!databaseIsConfigured()) return fallbackProducts(request);

  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim();
  const category = params.get("category");
  const brand = params.get("brand") ?? "";
  const minimum = parsePrice(params.get("minPrice"));
  const maximum = parsePrice(params.get("maxPrice"));
  const sort = params.get("sort") ?? "recommended";
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "24");
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50
  ) {
    return apiError("page must be positive and pageSize must be between 1 and 50.", 400);
  }
  if (
    Number.isNaN(minimum) ||
    Number.isNaN(maximum) ||
    (minimum !== undefined && maximum !== undefined && minimum > maximum)
  ) {
    return apiError("Provide a valid INR price range.", 400);
  }
  if (category && !productCategories.some((name) => categorySlug(name) === category)) {
    return apiError("Unknown product category.", 400);
  }

  const now = new Date();
  const priceFilter =
    minimum !== undefined || maximum !== undefined
      ? {
          gte: minimum,
          lte: maximum,
        }
      : undefined;
  const eligibleOfferWhere = {
    OR: [
      {
        isDemo: true,
        ...(priceFilter ? { price: priceFilter } : {}),
      },
      {
        isDemo: false,
        availability: "AVAILABLE" as const,
        freshnessExpiresAt: { gt: now },
        ...(priceFilter ? { price: priceFilter } : {}),
      },
    ],
  };
  const baseWhere = {
    ...(category ? { category: { slug: category } } : {}),
    ...(brand ? { brand: { equals: brand, mode: "insensitive" as const } } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { brand: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const hasPriceOrder =
    sort === "price-ascending" || sort === "price-descending";
  const where = {
    ...baseWhere,
    ...(priceFilter || hasPriceOrder
      ? { offers: { some: eligibleOfferWhere } }
      : {}),
  };
  const total = await prisma.product.count({ where });

  const priceSorted =
    hasPriceOrder
      ? await prisma.offer.groupBy({
          by: ["productId"],
          where: { ...eligibleOfferWhere, product: baseWhere },
          orderBy: {
            _min: { price: sort === "price-ascending" ? "asc" : "desc" },
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
      : undefined;
  const productIds = priceSorted?.map((row) => row.productId);
  const products = await prisma.product.findMany({
    where: productIds ? { ...where, id: { in: productIds } } : where,
    orderBy: { name: "asc" },
    ...(productIds ? {} : { skip: (page - 1) * pageSize }),
    take: pageSize,
    select: {
      id: true,
      slug: true,
      name: true,
      brand: true,
      variant: true,
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
        },
      },
    },
  });
  const priceOrder = new Map(productIds?.map((id, index) => [id, index]));
  if (priceOrder.size) {
    products.sort((left, right) => (priceOrder.get(left.id) ?? 0) - (priceOrder.get(right.id) ?? 0));
  }
  return Response.json({
    products: products.map((product) => ({
      ...product,
      offers: product.offers.map((offer) => ({
        ...offer,
        price: offer.price.toFixed(2),
        dataFreshness: getOfferDataState(offer, now),
      })),
    })),
    page,
    pageSize,
    total,
  });
}
