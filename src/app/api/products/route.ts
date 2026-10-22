import { NextRequest } from "next/server";
import { categorySlug, demoProducts, productCategories } from "@/mocks/products";
import { apiError } from "@/lib/api-response";
import { databaseIsConfigured } from "@/lib/database-config";
import { listLiveProducts } from "@/lib/firestore-products";

type ProductListItem = (typeof demoProducts)[number] | Awaited<ReturnType<typeof listLiveProducts>>[number];

function parsePrice(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value)) return NaN;
  return Number(value);
}

function categoryName(product: ProductListItem): string {
  return typeof product.category === "string"
    ? product.category
    : product.category.name;
}

function isInCategory(product: ProductListItem, slug: string): boolean {
  const category = productCategories.find((item) => item === categoryName(product));
  return category !== undefined && categorySlug(category) === slug;
}

function priceOf(product: ProductListItem): number {
  const prices = product.offers
    .filter((offer) => {
      if (!("isDemo" in offer)) return true;
      return offer.isDemo || (
        offer.availability === "AVAILABLE" &&
        "dataFreshness" in offer &&
        offer.dataFreshness === "FRESH"
      );
    })
    .map((offer) => Number(offer.price));
  return prices.length > 0 ? Math.min(...prices) : Number.POSITIVE_INFINITY;
}

export async function GET(request: NextRequest) {
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
  if (!["recommended", "name", "price-ascending", "price-descending"].includes(sort)) {
    return apiError("Unsupported product sort order.", 400);
  }

  const hasDatabase = databaseIsConfigured();
  const liveProducts = hasDatabase ? await listLiveProducts() : [];
  let products: ProductListItem[] = [...demoProducts, ...liveProducts];
  products = products.filter((product) => {
    const searchable = [
      product.name,
      product.brand,
      categoryName(product),
      product.variant,
      ...("specifications" in product ? product.specifications : []),
    ]
      .join(" ")
      .toLocaleLowerCase("en-IN");
    const price = priceOf(product);
    return (
      (!query || searchable.includes(query)) &&
      (!category || isInCategory(product, category)) &&
      (!brand || product.brand.toLocaleLowerCase("en-IN") === brand.toLocaleLowerCase("en-IN")) &&
      (minimum === undefined || price >= minimum) &&
      (maximum === undefined || price <= maximum)
    );
  });

  if (sort === "name") {
    products.sort((a, b) => a.name.localeCompare(b.name, "en-IN"));
  } else if (sort === "price-ascending" || sort === "price-descending") {
    const direction = sort === "price-ascending" ? 1 : -1;
    products.sort((a, b) => (priceOf(a) - priceOf(b)) * direction);
  }
  const total = products.length;
  return Response.json({
    dataStatus: liveProducts.length > 0 ? "MIXED" : "DEMO",
    products: products.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total,
  });
}
