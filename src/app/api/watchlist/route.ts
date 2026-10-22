import { FieldValue } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { demoProducts } from "@/mocks/products";
import { authIsConfigured } from "@/lib/auth";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getAuthenticatedUserId } from "@/lib/request-auth";

function validSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export async function GET() {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure Firebase Authentication before using watchlists.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to view your watchlist.", 401);

  const snapshot = await getFirebaseFirestore()
    .collection("users")
    .doc(userId)
    .collection("watchlist")
    .orderBy("createdAt", "desc")
    .get();
  const items = snapshot.docs.map((item) => ({
    id: item.id,
    createdAt: item.get("createdAt")?.toDate?.() ?? null,
    product: {
      slug: String(item.get("slug")),
      name: String(item.get("name")),
      brand: String(item.get("brand")),
      variant: String(item.get("variant")),
      isDemo: item.get("isDemo") === true,
    },
  }));
  return Response.json({ items });
}

export async function POST(request: Request) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure Firebase Authentication before saving products.");
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
    !validSlug(body.slug)
  ) {
    return apiError("Provide a valid product slug.", 400);
  }

  const demoProduct = demoProducts.find((product) => product.slug === body.slug);
  const db = getFirebaseFirestore();
  const storedProduct = demoProduct
    ? null
    : await db.collection("products").doc(body.slug).get();
  if (!demoProduct && (!storedProduct?.exists || storedProduct.get("isDemo") === true)) {
    return apiError("Product not found.", 404);
  }
  const product = demoProduct
    ? {
        slug: demoProduct.slug,
        name: demoProduct.name,
        brand: demoProduct.brand,
        variant: demoProduct.variant,
        isDemo: true,
      }
    : {
        slug: body.slug,
        name: String(storedProduct?.get("name")),
        brand: String(storedProduct?.get("brand")),
        variant: String(storedProduct?.get("variant")),
        isDemo: false,
      };
  const itemRef = db.collection("users").doc(userId).collection("watchlist").doc(body.slug);
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(itemRef);
    if (!existing.exists) {
      transaction.create(itemRef, {
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        variant: product.variant,
        isDemo: product.isDemo,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });
  const item = await itemRef.get();
  return Response.json({
    item: {
      id: item.id,
      createdAt: item.get("createdAt")?.toDate?.() ?? null,
    },
  });
}

export async function DELETE(request: NextRequest) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure Firebase Authentication before editing watchlists.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to edit your watchlist.", 401);

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug || !validSlug(slug)) return apiError("Provide a valid product slug.", 400);
  const itemRef = getFirebaseFirestore()
    .collection("users")
    .doc(userId)
    .collection("watchlist")
    .doc(slug);
  const item = await itemRef.get();
  if (!item.exists) return apiError("Saved product not found.", 404);
  await itemRef.delete();
  return Response.json({ deleted: true });
}
