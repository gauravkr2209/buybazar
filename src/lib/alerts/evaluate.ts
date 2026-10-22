import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { priceToMinorUnits } from "@/lib/providers/normalize";

const OBSERVATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 500;
const PRODUCT_BATCH_SIZE = 30;

type AlertRecord = {
  id: string;
  productSlug: string;
  targetPrice: string;
  cursorKey: string;
  isDemo: boolean;
  userId: string;
};

type ObservationRecord = {
  id: string;
  productSlug: string;
  price: string;
  observedAt: { toDate(): Date };
  freshnessExpiresAt: { toDate(): Date };
};

export async function evaluatePriceAlerts(afterCursor?: string) {
  const db = getFirebaseFirestore();
  const now = new Date();
  const cutoff = new Date(now.getTime() - OBSERVATION_MAX_AGE_MS);
  let query = db
    .collectionGroup("alerts")
    .where("enabled", "==", true)
    .orderBy("cursorKey")
    .limit(PAGE_SIZE);
  if (afterCursor) query = query.startAfter(afterCursor);
  const alertSnapshot = await query.get();
  if (alertSnapshot.empty) {
    return { evaluated: 0, queued: 0, nextCursor: null };
  }

  const alerts: AlertRecord[] = alertSnapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      productSlug: String(data.productSlug),
      targetPrice: String(data.targetPrice),
      cursorKey: String(data.cursorKey),
      isDemo: data.isDemo === true,
      userId: document.ref.parent.parent?.id ?? "",
    };
  });
  const productSlugs = [...new Set(alerts.filter((alert) => !alert.isDemo).map((alert) => alert.productSlug))];
  const observations: ObservationRecord[] = [];
  for (let offset = 0; offset < productSlugs.length; offset += PRODUCT_BATCH_SIZE) {
    const slugs = productSlugs.slice(offset, offset + PRODUCT_BATCH_SIZE);
    const snapshot = await db
      .collectionGroup("observations")
      .where("productSlug", "in", slugs)
      .where("isDemo", "==", false)
      .where("availability", "==", "AVAILABLE")
      .where("currency", "==", "INR")
      .where("observedAt", ">=", cutoff)
      .where("freshnessExpiresAt", ">", now)
      .limit(500)
      .get();
    for (const document of snapshot.docs) {
      const data = document.data();
      const observedAt = data.observedAt as ObservationRecord["observedAt"];
      const freshnessExpiresAt = data.freshnessExpiresAt as ObservationRecord["freshnessExpiresAt"];
      if (
        observedAt.toDate() <= now &&
        freshnessExpiresAt.toDate() > now &&
        /^\d+(?:\.\d{1,2})?$/.test(String(data.price))
      ) {
        observations.push({
          id: document.id,
          productSlug: String(data.productSlug),
          price: String(data.price),
          observedAt,
          freshnessExpiresAt,
        });
      }
    }
  }

  const lowestFreshObservation = new Map<string, ObservationRecord>();
  for (const observation of observations) {
    const current = lowestFreshObservation.get(observation.productSlug);
    if (
      !current ||
      priceToMinorUnits(observation.price) < priceToMinorUnits(current.price)
    ) {
      lowestFreshObservation.set(observation.productSlug, observation);
    }
  }

  let queued = 0;
  for (const alert of alerts) {
    if (alert.isDemo) continue;
    const observation = lowestFreshObservation.get(alert.productSlug);
    if (
      !observation ||
      priceToMinorUnits(observation.price) > priceToMinorUnits(alert.targetPrice)
    ) continue;
    const userId = alert.userId;
    if (!userId) continue;
    const alertRef = db.collection("users").doc(userId).collection("alerts").doc(alert.id);
    const notificationId = createHash("sha256")
      .update(`${alert.id}\0${observation.id}`)
      .digest("hex");
    const notificationRef = alertRef.collection("notifications").doc(notificationId);
    const created = await db.runTransaction(async (transaction) => {
      const [currentAlert, existingNotification] = await transaction.getAll(
        alertRef,
        notificationRef,
      );
      if (!currentAlert.exists || currentAlert.get("enabled") !== true || existingNotification.exists) {
        return false;
      }
      transaction.create(notificationRef, {
        observationId: observation.id,
        status: "PENDING",
        message: "A fresh verified price observation met your target. Review the product page for its source and timestamp.",
        createdAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    if (created) queued += 1;
  }

  return {
    evaluated: alerts.length,
    queued,
    nextCursor:
      alertSnapshot.size === PAGE_SIZE
        ? alerts[alerts.length - 1]?.cursorKey ?? null
        : null,
  };
}
