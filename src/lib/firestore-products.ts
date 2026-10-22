import type { DocumentData, DocumentSnapshot, Timestamp } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getOfferDataState } from "@/lib/offer-state";

type StoredProduct = {
  slug: string;
  name: string;
  brand: string;
  variant: string;
  variantKey: string;
  description?: string | null;
  attributes?: unknown;
  isDemo: boolean;
  category: { name: string; slug: string };
  identifiers?: { type: string; value: string }[];
};

type StoredOffer = {
  id: string;
  merchantName: string;
  price: string;
  currency: string;
  availability: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
  isDemo: boolean;
  sourceName: string;
  sourceUrl: string | null;
  lastCheckedAt: Date | Timestamp;
  freshnessExpiresAt: Date | Timestamp | null;
};

function toDate(value: Date | Timestamp | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : value.toDate();
}

function offerResponse(
  id: string,
  data: DocumentData,
  now = new Date(),
) {
  const offer: StoredOffer = { id, ...data } as StoredOffer;
  const lastCheckedAt = toDate(offer.lastCheckedAt);
  const freshnessExpiresAt = toDate(offer.freshnessExpiresAt);
  const normalized = {
    ...offer,
    lastCheckedAt,
    freshnessExpiresAt,
  };
  return {
    ...normalized,
    dataFreshness: getOfferDataState(normalized, now),
  };
}

async function readLiveProduct(
  productSnapshot: DocumentSnapshot<DocumentData>,
  includeHistory: boolean,
) {
  if (!productSnapshot.exists) return null;
  const slug = productSnapshot.id;
  const db = getFirebaseFirestore();
  const product = productSnapshot.data() as StoredProduct;
  if (product.isDemo) return null;
  const offerSnapshots = await db
    .collection("products")
    .doc(slug)
    .collection("offers")
    .orderBy("priceMinor", "asc")
    .limit(100)
    .get();
  const now = new Date();
  const offers = await Promise.all(offerSnapshots.docs.map(async (offerSnapshot) => {
    const offer = offerResponse(offerSnapshot.id, offerSnapshot.data(), now);
    if (!includeHistory) return offer;
    const observationsSnapshot = await offerSnapshot.ref
      .collection("observations")
      .orderBy("observedAt", "desc")
      .limit(100)
      .get();
    const observations = observationsSnapshot.docs.map((observation) => {
      const data = observation.data();
      const observedAt = toDate(data.observedAt as Date | Timestamp);
      const freshnessExpiresAt = toDate(
        data.freshnessExpiresAt as Date | Timestamp | null,
      );
      const normalized = {
        isDemo: data.isDemo === true,
        availability:
          data.availability === "AVAILABLE" ||
          data.availability === "UNAVAILABLE"
            ? data.availability
            : "UNKNOWN",
        freshnessExpiresAt,
      };
      return {
        ...data,
        observedAt,
        freshnessExpiresAt,
        dataFreshness: getOfferDataState(normalized, now),
      };
    });
    return { ...offer, observations };
  }));

  return {
    id: product.slug,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    variant: product.variant,
    description: product.description ?? null,
    attributes: product.attributes ?? null,
    isDemo: false,
    category: product.category,
    offers,
  };
}

export async function getLiveProduct(slug: string, includeHistory = true) {
  const productSnapshot = await getFirebaseFirestore().collection("products").doc(slug).get();
  return readLiveProduct(productSnapshot, includeHistory);
}

export async function listLiveProducts(limit = 500) {
  const snapshot = await getFirebaseFirestore()
    .collection("products")
    .where("isDemo", "==", false)
    .orderBy("slug", "asc")
    .limit(limit)
    .get();
  const products = await Promise.all(
    snapshot.docs.map((product) => readLiveProduct(product, false)),
  );
  return products.filter((product): product is NonNullable<typeof product> => product !== null);
}
