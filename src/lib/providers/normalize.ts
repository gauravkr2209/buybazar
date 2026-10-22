import type {
  NormalizedProviderOffer,
  ProviderIdentifier,
} from "@/lib/providers/types";
import { ProviderOfferValidationError } from "@/lib/providers/types";

const PRICE_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

export type IdentifiedProduct = {
  id: string;
  brand: string;
  variantKey: string;
  isDemo: boolean;
};

export type ProductIdentifierLink = ProviderIdentifier & {
  productId: string;
  product: IdentifiedProduct;
};

export function priceToMinorUnits(price: string): number {
  const [whole, fraction = ""] = price.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function normalizeIdentifier(identifier: ProviderIdentifier): ProviderIdentifier {
  if (
    !identifier ||
    typeof identifier.type !== "string" ||
    typeof identifier.value !== "string"
  ) {
    throw new ProviderOfferValidationError("Provider product identifier is malformed.");
  }
  const type = identifier.type.trim().toLocaleLowerCase("en-IN");
  const value = identifier.value.trim().toLocaleUpperCase("en-IN");
  if (!/^[a-z0-9_-]{1,32}$/.test(type) || value.length < 1 || value.length > 128) {
    throw new ProviderOfferValidationError("Provider product identifier is malformed.");
  }
  return { type, value };
}

export function normalizeProviderOffer(
  input: NormalizedProviderOffer,
): NormalizedProviderOffer {
  if (
    !input ||
    typeof input.providerOfferId !== "string" ||
    typeof input.merchantName !== "string" ||
    typeof input.sourceName !== "string" ||
    typeof input.sourceUrl !== "string" ||
    typeof input.price !== "string" ||
    typeof input.brand !== "string" ||
    typeof input.variantKey !== "string"
  ) {
    throw new ProviderOfferValidationError("Provider offer contains malformed fields.");
  }
  const merchantName = input.merchantName.trim().replace(/\s+/g, " ");
  const sourceName = input.sourceName.trim();
  const providerOfferId = input.providerOfferId.trim();
  const brand = input.brand.trim().replace(/\s+/g, " ");
  const variantKey = input.variantKey.trim().replace(/\s+/g, " ");
  if (!Array.isArray(input.identifiers) || input.identifiers.length < 1 || input.identifiers.length > 10) {
    throw new ProviderOfferValidationError("Provider offer must have one to ten exact product identifiers.");
  }
  let sourceUrl: URL;
  try {
    sourceUrl = new URL(input.sourceUrl);
  } catch {
    throw new ProviderOfferValidationError("Provider source URL is invalid.");
  }
  const observedAt = new Date(input.observedAt);
  const freshnessExpiresAt = new Date(input.freshnessExpiresAt);

  if (!providerOfferId || providerOfferId.length > 200) {
    throw new ProviderOfferValidationError("Provider offer ID is invalid.");
  }
  if (
    !merchantName ||
    merchantName.length > 120 ||
    !sourceName ||
    sourceName.length > 120 ||
    input.sourceUrl.length > 2048
  ) {
    throw new ProviderOfferValidationError("Provider merchant or source name is invalid.");
  }
  if (sourceUrl.protocol !== "https:" || sourceUrl.username || sourceUrl.password) {
    throw new ProviderOfferValidationError("Provider source URL must use HTTPS.");
  }
  if (input.currency !== "INR" || !PRICE_PATTERN.test(input.price) || Number(input.price) <= 0) {
    throw new ProviderOfferValidationError("Provider price must be a positive INR amount.");
  }
  if (!["AVAILABLE", "UNAVAILABLE", "UNKNOWN"].includes(input.availability)) {
    throw new ProviderOfferValidationError("Provider offer availability is invalid.");
  }
  if (
    !Number.isFinite(observedAt.getTime()) ||
    !Number.isFinite(freshnessExpiresAt.getTime()) ||
    freshnessExpiresAt <= observedAt ||
    observedAt.getTime() > Date.now() + 5 * 60 * 1000
  ) {
    throw new ProviderOfferValidationError("Provider observation or freshness timestamp is invalid.");
  }
  if (!brand || brand.length > 120 || !variantKey || variantKey.length > 200) {
    throw new ProviderOfferValidationError("Provider brand and variant are required.");
  }

  const identifiers = input.identifiers.map(normalizeIdentifier);
  if (new Set(identifiers.map(({ type, value }) => `${type}:${value}`)).size !== identifiers.length) {
    throw new ProviderOfferValidationError("Provider product identifiers are duplicated.");
  }

  return {
    ...input,
    providerOfferId,
    identifiers,
    brand: brand.toLocaleLowerCase("en-IN"),
    variantKey: variantKey.toLocaleLowerCase("en-IN"),
    merchantName,
    sourceName,
    sourceUrl: sourceUrl.toString(),
    observedAt,
    freshnessExpiresAt,
  };
}

export function retryDelayMs(
  attempt: number,
  retryAfterMs?: number,
  maxDelayMs = 30_000,
): number {
  if (retryAfterMs !== undefined) {
    return Math.min(Math.max(retryAfterMs, 0), maxDelayMs);
  }
  return Math.min(500 * 2 ** Math.max(attempt - 1, 0), maxDelayMs);
}

export function findExactProductMatch(
  identifiers: ProviderIdentifier[],
  links: ProductIdentifierLink[],
  brand: string,
  variantKey: string,
): IdentifiedProduct | undefined {
  const productIds = identifiers.map((identifier) => {
    const link = links.find(
      (candidate) =>
        candidate.type === identifier.type && candidate.value === identifier.value,
    );
    return link?.productId;
  });
  if (
    productIds.some((id) => id === undefined) ||
    new Set(productIds).size !== 1
  ) return undefined;

  const link = links.find((candidate) => candidate.productId === productIds[0]);
  const product = link?.product;
  if (
    !product ||
    product.isDemo ||
    product.brand.toLocaleLowerCase("en-IN") !== brand.toLocaleLowerCase("en-IN") ||
    product.variantKey.toLocaleLowerCase("en-IN") !==
      variantKey.toLocaleLowerCase("en-IN")
  ) return undefined;
  return product;
}
