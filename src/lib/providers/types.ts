export type ProviderIdentifier = {
  type: string;
  value: string;
};

export type ProviderProductRequest = {
  productSlug: string;
  brand: string;
  variantKey: string;
  identifiers: ProviderIdentifier[];
};

export type NormalizedProviderOffer = {
  providerOfferId: string;
  identifiers: ProviderIdentifier[];
  brand: string;
  variantKey: string;
  merchantName: string;
  price: string;
  currency: "INR";
  availability: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
  sourceName: string;
  sourceUrl: string;
  observedAt: Date;
  freshnessExpiresAt: Date;
};

export type ProviderAdapter = {
  id: string;
  minimumIntervalMs: number;
  isConfigured(): boolean;
  fetchOffers(products: ProviderProductRequest[]): Promise<NormalizedProviderOffer[]>;
};

export class ProviderRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "ProviderRequestError";
  }
}

export class ProviderOfferValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderOfferValidationError";
  }
}
