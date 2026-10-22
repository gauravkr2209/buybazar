import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { demoProducts } from "@/mocks/products";
import { authIsConfigured } from "@/lib/auth";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getAuthenticatedUserId } from "@/lib/request-auth";

const PRICE_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

function validPrice(value: unknown): value is string {
  return (
    typeof value === "string" &&
    PRICE_PATTERN.test(value) &&
    Number(value) > 0 &&
    Number.isFinite(Number(value))
  );
}

function normalizedPrice(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
}

function targetKey(productSlug: string, targetPrice: string): string {
  return createHash("sha256")
    .update(`${productSlug}\0${normalizedPrice(targetPrice)}`)
    .digest("hex");
}

export async function GET() {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure Firebase Authentication before using price alerts.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to view price alerts.", 401);

  const alertSnapshot = await getFirebaseFirestore()
    .collection("users")
    .doc(userId)
    .collection("alerts")
    .orderBy("createdAt", "desc")
    .get();
  const alerts = await Promise.all(
    alertSnapshot.docs.map(async (alert) => {
      const notifications = await alert.ref
        .collection("notifications")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      const data = alert.data();
      return {
        id: alert.id,
        targetPrice: String(data.targetPrice),
        currency: "INR",
        enabled: data.enabled === true,
        createdAt: data.createdAt?.toDate?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.() ?? null,
        product: {
          slug: String(data.productSlug),
          name: String(data.productName),
          isDemo: data.isDemo === true,
        },
        notifications: notifications.docs.map((notification) => {
          const value = notification.data();
          return {
            status: String(value.status),
            message: String(value.message),
            createdAt: value.createdAt?.toDate?.() ?? null,
          };
        }),
      };
    }),
  );
  return Response.json({ alerts });
}

export async function POST(request: Request) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure Firebase Authentication before creating alerts.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to create price alerts.", 401);

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
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) ||
    !("targetPrice" in body) ||
    !validPrice(body.targetPrice)
  ) {
    return apiError("Provide a valid product slug and positive INR target price.", 400);
  }

  const demoProduct = demoProducts.find((product) => product.slug === body.slug);
  const db = getFirebaseFirestore();
  const storedProduct = demoProduct
    ? null
    : await db.collection("products").doc(body.slug).get();
  if (!demoProduct && (!storedProduct?.exists || storedProduct.get("isDemo") === true)) {
    return apiError("Product not found.", 404);
  }
  const productName = demoProduct?.name ?? String(storedProduct?.get("name"));
  const isDemo = demoProduct !== undefined;
  const price = normalizedPrice(body.targetPrice);
  const userRef = db.collection("users").doc(userId);
  const keyRef = userRef.collection("alertTargets").doc(targetKey(body.slug, price));
  const alertsRef = userRef.collection("alerts");
  const newAlertRef = alertsRef.doc();

  const alert = await db.runTransaction(async (transaction) => {
    const keySnapshot = await transaction.get(keyRef);
    if (keySnapshot.exists) {
      const existingRef = alertsRef.doc(String(keySnapshot.get("alertId")));
      const existing = await transaction.get(existingRef);
      if (!existing.exists) {
        transaction.delete(keyRef);
      } else {
        transaction.update(existingRef, {
          enabled: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        return { id: existing.id, targetPrice: String(existing.get("targetPrice")) };
      }
    }
    transaction.create(newAlertRef, {
      productSlug: body.slug,
      productName,
      targetPrice: price,
      currency: "INR",
      enabled: true,
      isDemo,
      cursorKey: createHash("sha256").update(`${userId}\0${newAlertRef.id}`).digest("hex"),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(keyRef, { alertId: newAlertRef.id });
    return { id: newAlertRef.id, targetPrice: price };
  });
  return Response.json({
    alert: { ...alert, enabled: true },
  });
}
