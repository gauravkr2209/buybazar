import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { authIsConfigured } from "@/lib/auth";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getAuthenticatedUserId } from "@/lib/request-auth";

type AlertRouteProps = { params: Promise<{ id: string }> };
const PRICE_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

function normalizedPrice(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
}

function targetKey(productSlug: string, targetPrice: string): string {
  return createHash("sha256")
    .update(`${productSlug}\0${normalizedPrice(targetPrice)}`)
    .digest("hex");
}

export async function PATCH(request: NextRequest, { params }: AlertRouteProps) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure Firebase Authentication before editing price alerts.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to edit price alerts.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return apiError("Request body must be valid JSON.", 400);
    throw error;
  }
  if (typeof body !== "object" || body === null) {
    return apiError("Provide an alert update.", 400);
  }

  const data: { enabled?: boolean; targetPrice?: string } = {};
  if ("enabled" in body) {
    if (typeof body.enabled !== "boolean") return apiError("enabled must be a boolean.", 400);
    data.enabled = body.enabled;
  }
  if ("targetPrice" in body) {
    if (
      typeof body.targetPrice !== "string" ||
      !PRICE_PATTERN.test(body.targetPrice) ||
      Number(body.targetPrice) <= 0 ||
      !Number.isFinite(Number(body.targetPrice))
    ) {
      return apiError("targetPrice must be a positive INR amount with up to two decimals.", 400);
    }
    data.targetPrice = normalizedPrice(body.targetPrice);
  }
  if (Object.keys(data).length === 0) return apiError("Provide enabled or targetPrice.", 400);

  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return apiError("Invalid alert ID.", 400);
  const db = getFirebaseFirestore();
  const userRef = db.collection("users").doc(userId);
  const alertRef = userRef.collection("alerts").doc(id);
  const result = await db.runTransaction(async (transaction) => {
    const alert = await transaction.get(alertRef);
    if (!alert.exists) return "missing" as const;

    if (data.targetPrice) {
      const productSlug = String(alert.get("productSlug"));
      const previousPrice = String(alert.get("targetPrice"));
      const previousKey = userRef
        .collection("alertTargets")
        .doc(targetKey(productSlug, previousPrice));
      const nextKey = userRef
        .collection("alertTargets")
        .doc(targetKey(productSlug, data.targetPrice));
      if (previousPrice !== data.targetPrice) {
        const keySnapshot = await transaction.get(nextKey);
        if (keySnapshot.exists && keySnapshot.get("alertId") !== id) {
          return "duplicate" as const;
        }
        transaction.delete(previousKey);
        transaction.set(nextKey, { alertId: id });
      }
    }
    transaction.update(alertRef, {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return "updated" as const;
  });
  if (result === "missing") return apiError("Price alert not found.", 404);
  if (result === "duplicate") {
    return apiError("An alert for this product and target price already exists.", 409);
  }
  return Response.json({ updated: true });
}

export async function DELETE(_request: Request, { params }: AlertRouteProps) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure Firebase Authentication before deleting price alerts.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to delete price alerts.", 401);

  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return apiError("Invalid alert ID.", 400);
  const db = getFirebaseFirestore();
  const userRef = db.collection("users").doc(userId);
  const alertRef = userRef.collection("alerts").doc(id);
  const deleted = await db.runTransaction(async (transaction) => {
    const alert = await transaction.get(alertRef);
    if (!alert.exists) return false;
    const keyRef = userRef
      .collection("alertTargets")
      .doc(targetKey(String(alert.get("productSlug")), String(alert.get("targetPrice"))));
    transaction.delete(keyRef);
    transaction.delete(alertRef);
    return true;
  });
  if (!deleted) return apiError("Price alert not found.", 404);
  await db.recursiveDelete(alertRef);
  return Response.json({ deleted: true });
}
