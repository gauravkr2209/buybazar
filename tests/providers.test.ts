import assert from "node:assert/strict";
import test from "node:test";
import {
  findExactProductMatch,
  normalizeProviderOffer,
  priceToMinorUnits,
  retryDelayMs,
} from "../src/lib/providers/normalize";
import { fetchWithRetry } from "../src/lib/providers/sync";
import {
  ProviderOfferValidationError,
  ProviderRequestError,
  type ProviderAdapter,
} from "../src/lib/providers/types";

const validOffer = {
  providerOfferId: "offer-123",
  identifiers: [{ type: "GTIN", value: "1234567890123" }],
  brand: "Aster",
  variantKey: "128 gb · sage",
  merchantName: "  Example   Merchant ",
  price: "23999.50",
  currency: "INR" as const,
  availability: "AVAILABLE" as const,
  sourceName: "Authorized provider",
  sourceUrl: "https://merchant.example/products/aster",
  observedAt: new Date("2026-06-12T12:00:00.000Z"),
  freshnessExpiresAt: new Date("2026-06-13T12:00:00.000Z"),
};

test("normalizes provider identifiers and validates decimal-safe INR offers", () => {
  const normalized = normalizeProviderOffer(validOffer);
  assert.equal(normalized.price, "23999.50");
  assert.equal(normalized.providerOfferId, "offer-123");
  assert.deepEqual(normalized.identifiers, [
    { type: "gtin", value: "1234567890123" },
  ]);
  assert.equal(normalized.merchantName, "Example Merchant");
});

test("converts INR decimal strings to exact paise for ordering and comparisons", () => {
  assert.equal(priceToMinorUnits("12"), 1200);
  assert.equal(priceToMinorUnits("12.5"), 1250);
  assert.equal(priceToMinorUnits("12.05"), 1205);
  assert.equal(priceToMinorUnits("9999999999.99"), 999999999999);
});

test("rejects malformed prices, unsecured URLs, and stale timestamp ordering", () => {
  assert.throws(
    () => normalizeProviderOffer({ ...validOffer, price: "100.001" }),
    ProviderOfferValidationError,
  );
  assert.throws(
    () => normalizeProviderOffer({ ...validOffer, sourceUrl: "http://merchant.example" }),
    ProviderOfferValidationError,
  );
  assert.throws(
    () =>
      normalizeProviderOffer({
        ...validOffer,
        freshnessExpiresAt: new Date("2026-06-12T11:59:00.000Z"),
      }),
    ProviderOfferValidationError,
  );
  const malformedAvailability = { ...validOffer };
  Reflect.set(malformedAvailability, "availability", "PENDING");
  assert.throws(() => normalizeProviderOffer(malformedAvailability), ProviderOfferValidationError);
  assert.throws(
    () =>
      normalizeProviderOffer({
        ...validOffer,
        observedAt: new Date(Date.now() + 60 * 60 * 1000),
        freshnessExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      }),
    ProviderOfferValidationError,
  );
});

test("product matching requires exact identifiers, brand, and variant", () => {
  const links = [{
    type: "gtin",
    value: "1234567890123",
    productId: "product-1",
    product: {
      id: "product-1",
      brand: "Aster",
      variantKey: "128 gb · sage",
      isDemo: false,
    },
  }];
  assert.equal(
    findExactProductMatch(
      validOffer.identifiers.map((identifier) => ({
        type: identifier.type.toLocaleLowerCase("en-IN"),
        value: identifier.value,
      })),
      links,
      "aster",
      "128 gb · sage",
    )?.id,
    "product-1",
  );
  assert.equal(
    findExactProductMatch(
      [{ type: "gtin", value: "1234567890123" }],
      links,
      "Aster",
      "256 gb · sage",
    ),
    undefined,
  );
  assert.equal(
    findExactProductMatch(
      [{ type: "gtin", value: "different" }],
      links,
      "Aster",
      "128 gb · sage",
    ),
    undefined,
  );
});

test("retry delay respects retry-after and a maximum backoff", () => {
  assert.equal(retryDelayMs(1, 900_000), 30_000);
  assert.equal(retryDelayMs(3), 2_000);
});

test("provider retry handling retries transient server errors only", async () => {
  let attempts = 0;
  const adapter: ProviderAdapter = {
    id: "test-provider",
    minimumIntervalMs: 0,
    isConfigured: () => true,
    async fetchOffers() {
      attempts += 1;
      if (attempts === 1) throw new ProviderRequestError("temporary", 503);
      return [];
    },
  };
  assert.deepEqual(await fetchWithRetry(adapter, []), []);
  assert.equal(attempts, 2);

  const denied: ProviderAdapter = {
    ...adapter,
    id: "denied-provider",
    async fetchOffers() {
      attempts += 1;
      throw new ProviderRequestError("denied", 403);
    },
  };
  await assert.rejects(fetchWithRetry(denied, []), ProviderRequestError);
  assert.equal(attempts, 3);
});
