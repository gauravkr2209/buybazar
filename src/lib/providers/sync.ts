import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  findExactProductMatch,
  normalizeIdentifier,
  normalizeProviderOffer,
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

export async function fetchWithRetry(
  adapter: ProviderAdapter,
  products: ProviderProductRequest[],
  maxAttempts = 3,
): Promise<NormalizedProviderOffer[]> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const previous = rateLimitQueues.get(adapter.id) ?? Promise.resolve();
    const requestSlot = previous.catch(() => undefined).then(async () => {
      const lastAt = lastRequestAt.get(adapter.id) ?? 0;
      const delay = adapter.minimumIntervalMs - (Date.now() - lastAt);
      if (delay > 0) await wait(delay);
      lastRequestAt.set(adapter.id, Date.now());
    });
    rateLimitQueues.set(adapter.id, requestSlot);
    await requestSlot;

    try {
      return await adapter.fetchOffers(products);
    } catch (error) {
      const retryable =
        error instanceof TypeError ||
        (error instanceof ProviderRequestError &&
          (error.status === 429 || error.status >= 500));
      if (!retryable || attempt === maxAttempts) {
        throw error;
      }
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
  const exactMatches = await prisma.productIdentifier.findMany({
    where: {
      OR: offer.identifiers.map((identifier) => {
        const normalized = normalizeIdentifier(identifier);
        return { type: normalized.type, value: normalized.value };
      }),
    },
    select: {
      type: true,
      value: true,
      productId: true,
      product: {
        select: {
          id: true,
          brand: true,
          variantKey: true,
          isDemo: true,
        },
      },
    },
  });
  const confirmedMatch = findExactProductMatch(
    offer.identifiers,
    exactMatches,
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
  await prisma.$transaction(async (transaction) => {
    const merchant = await transaction.merchant.upsert({
      where: { normalizedName: normalizedMerchant },
      update: { name: offer.merchantName },
      create: { name: offer.merchantName, normalizedName: normalizedMerchant },
    });
    const uniqueOffer = {
      merchantId: merchant.id,
      productId: confirmedMatch.id,
      providerOfferId: `${adapterId}:${offer.providerOfferId}`,
    };
    const storedOffer = await transaction.offer.upsert({
      where: { merchantId_productId_providerOfferId: uniqueOffer },
      update: {
        price: new Prisma.Decimal(offer.price),
        currency: offer.currency,
        availability: offer.availability,
        isDemo: false,
        sourceName: offer.sourceName,
        sourceUrl: offer.sourceUrl,
        lastCheckedAt: offer.observedAt,
        freshnessExpiresAt: offer.freshnessExpiresAt,
      },
      create: {
        ...uniqueOffer,
        price: new Prisma.Decimal(offer.price),
        currency: offer.currency,
        availability: offer.availability,
        isDemo: false,
        sourceName: offer.sourceName,
        sourceUrl: offer.sourceUrl,
        lastCheckedAt: offer.observedAt,
        freshnessExpiresAt: offer.freshnessExpiresAt,
      },
    });

    await transaction.priceObservation.upsert({
      where: {
        offerId_observedAt: {
          offerId: storedOffer.id,
          observedAt: offer.observedAt,
        },
      },
      update: {
        price: new Prisma.Decimal(offer.price),
        currency: offer.currency,
        availability: offer.availability,
        isDemo: false,
        sourceName: offer.sourceName,
        sourceUrl: offer.sourceUrl,
        freshnessExpiresAt: offer.freshnessExpiresAt,
      },
      create: {
        productId: confirmedMatch.id,
        offerId: storedOffer.id,
        price: new Prisma.Decimal(offer.price),
        currency: offer.currency,
        availability: offer.availability,
        isDemo: false,
        sourceName: offer.sourceName,
        sourceUrl: offer.sourceUrl,
        observedAt: offer.observedAt,
        freshnessExpiresAt: offer.freshnessExpiresAt,
      },
    });
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
