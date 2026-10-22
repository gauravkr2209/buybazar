import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { databaseIsConfigured } from "@/lib/database-config";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import {
  findExactProductMatch,
  normalizeIdentifier,
  normalizeProviderOffer,
  priceToMinorUnits,
  retryDelayMs,
} from "@/lib/providers/normalize";
import {
  ProviderRequestError,
  ProviderOfferValidationError,
  type NormalizedProviderOffer,
  type ProviderAdapter,
  type ProviderProductRequest,
} from "@/lib/providers/types";

const lastRequestAt = new Map<string, number>();
const rateLimitQueues = new Map<string, Promise<void>>();

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForRequestSlot(adapter: ProviderAdapter): Promise<void> {
  if (databaseIsConfigured()) {
    const db = getFirebaseFirestore();
    const slotRef = db.collection("providerRateLimits").doc(adapter.id);
    const delay = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(slotRef);
      const now = Date.now();
      const nextSlot = Math.max(
        now,
        typeof snapshot.get("nextSlotAt") === "number" ? snapshot.get("nextSlotAt") : now,
      );
      transaction.set(slotRef, { nextSlotAt: nextSlot + adapter.minimumIntervalMs });
      return nextSlot - now;
    });
    if (delay > 0) await wait(delay);
    return;
  }

  const previous = rateLimitQueues.get(adapter.id) ?? Promise.resolve();
  const requestSlot = previous.catch(() => undefined).then(async () => {
    const lastAt = lastRequestAt.get(adapter.id) ?? 0;
    const delay = adapter.minimumIntervalMs - (Date.now() - lastAt);
    if (delay > 0) await wait(delay);
    lastRequestAt.set(adapter.id, Date.now());
  });
  rateLimitQueues.set(adapter.id, requestSlot);
  await requestSlot;
}

export async function fetchWithRetry(
  adapter: ProviderAdapter,
  products: ProviderProductRequest[],
  maxAttempts = 3,
): Promise<NormalizedProviderOffer[]> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await waitForRequestSlot(adapter);
    try {
      return await adapter.fetchOffers(products);
    } catch (error) {
      const retryable =
        error instanceof TypeError ||
        (error instanceof ProviderRequestError &&
          (error.status === 429 || error.status >= 500));
      if (!retryable || attempt === maxAttempts) throw error;
      await wait(
        retryDelayMs(
          attempt,
          error instanceof ProviderRequestError ? error.retryAfterMs : undefined,
        ),
      );
    }
  }
  throw new Error(`Provider ${adapter.id} exhausted its retry policy.`);
}

async function persistOffer(adapterId: string, rawOffer: NormalizedProviderOffer) {
  const offer = normalizeProviderOffer(rawOffer);
  const db = getFirebaseFirestore();
  const identifiers = offer.identifiers.map(normalizeIdentifier);
  const identifierRefs = identifiers.map((identifier) =>
    db.collection("productIdentifiers").doc(
      createHash("sha256").update(`${identifier.type}\0${identifier.value}`).digest("hex"),
    ),
  );
  const identifierSnapshots = await db.getAll(...identifierRefs);
  if (identifierSnapshots.some((snapshot) => !snapshot.exists)) {
    throw new ProviderOfferValidationError(
      `Provider ${adapterId} offer did not match a registered product variant.`,
    );
  }
  const productSlugs = new Set(
    identifierSnapshots.map((snapshot) => String(snapshot.get("productSlug"))),
  );
  if (productSlugs.size !== 1) {
    throw new ProviderOfferValidationError(
      `Provider ${adapterId} identifiers matched different product variants.`,
    );
  }
  const productSlug = [...productSlugs][0];
  const productRef = db.collection("products").doc(productSlug);
  const productSnapshot = await productRef.get();
  if (!productSnapshot.exists) {
    throw new ProviderOfferValidationError(
      `Provider ${adapterId} offer matched a missing product record.`,
    );
  }
  const productData = productSnapshot.data() ?? {};
  const confirmedMatch = findExactProductMatch(
    identifiers,
    identifierSnapshots.map((snapshot, index) => ({
      ...identifiers[index],
      productId: productSlug,
      product: {
        id: productSlug,
        brand: String(productData.brand ?? ""),
        variantKey: String(productData.variantKey ?? ""),
        isDemo: productData.isDemo === true,
      },
    })),
    offer.brand,
    offer.variantKey,
  );
  if (!confirmedMatch) {
    throw new ProviderOfferValidationError(
      `Provider ${adapterId} offer did not exactly match a verified product variant.`,
    );
  }

  const normalizedMerchant = offer.merchantName
    .toLocaleLowerCase("en-IN")
    .replace(/\s+/g, " ");
  const merchantId = createHash("sha256").update(normalizedMerchant).digest("hex");
  const merchantRef = db.collection("merchants").doc(merchantId);
  const offerId = createHash("sha256")
    .update(`${adapterId}\0${offer.providerOfferId}`)
    .digest("hex");
  const offerRef = productRef.collection("offers").doc(offerId);
  const observationId = createHash("sha256")
    .update(`${offerId}\0${offer.observedAt.toISOString()}`)
    .digest("hex");
  const observationRef = offerRef.collection("observations").doc(observationId);

  await db.runTransaction(async (transaction) => {
    transaction.set(
      merchantRef,
      {
        name: offer.merchantName,
        normalizedName: normalizedMerchant,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    transaction.set(
      offerRef,
      {
        id: offerId,
        productSlug,
        merchantId,
        merchantName: offer.merchantName,
        providerOfferId: `${adapterId}:${offer.providerOfferId}`,
        price: offer.price,
        priceMinor: priceToMinorUnits(offer.price),
        currency: offer.currency,
        availability: offer.availability,
        isDemo: false,
        sourceName: offer.sourceName,
        sourceUrl: offer.sourceUrl,
        lastCheckedAt: offer.observedAt,
        freshnessExpiresAt: offer.freshnessExpiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    transaction.set(
      observationRef,
      {
        id: observationId,
        offerId,
        productSlug,
        price: offer.price,
        priceMinor: priceToMinorUnits(offer.price),
        currency: offer.currency,
        availability: offer.availability,
        isDemo: false,
        sourceName: offer.sourceName,
        sourceUrl: offer.sourceUrl,
        observedAt: offer.observedAt,
        freshnessExpiresAt: offer.freshnessExpiresAt,
      },
      { merge: true },
    );
  });
}

export async function synchronizeProvider(
  adapter: ProviderAdapter,
  products: ProviderProductRequest[],
): Promise<{ accepted: number; rejected: number }> {
  if (!adapter.isConfigured()) {
    throw new Error(`Provider ${adapter.id} is not configured with approved access credentials.`);
  }
  const offers = await fetchWithRetry(adapter, products);
  let accepted = 0;
  let rejected = 0;
  for (const offer of offers) {
    try {
      await persistOffer(adapter.id, offer);
      accepted += 1;
    } catch (error) {
      if (!(error instanceof ProviderOfferValidationError)) throw error;
      rejected += 1;
      console.error(`Rejected malformed or unmatched offer from provider ${adapter.id}.`);
    }
  }
  return { accepted, rejected };
}
