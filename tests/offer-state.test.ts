import assert from "node:assert/strict";
import test from "node:test";
import { getOfferDataState } from "../src/lib/offer-state";

const now = new Date("2026-06-12T12:00:00.000Z");

test("offer data states distinguish demo, fresh, stale, unavailable, and unknown", () => {
  assert.equal(
    getOfferDataState({
      isDemo: true,
      availability: "UNKNOWN",
      freshnessExpiresAt: null,
    }, now),
    "DEMO",
  );
  assert.equal(
    getOfferDataState({
      isDemo: false,
      availability: "AVAILABLE",
      freshnessExpiresAt: new Date("2026-06-12T13:00:00.000Z"),
    }, now),
    "FRESH",
  );
  assert.equal(
    getOfferDataState({
      isDemo: false,
      availability: "AVAILABLE",
      freshnessExpiresAt: new Date("2026-06-12T11:00:00.000Z"),
    }, now),
    "STALE",
  );
  assert.equal(
    getOfferDataState({
      isDemo: false,
      availability: "UNAVAILABLE",
      freshnessExpiresAt: null,
    }, now),
    "UNAVAILABLE",
  );
  assert.equal(
    getOfferDataState({
      isDemo: false,
      availability: "UNKNOWN",
      freshnessExpiresAt: null,
    }, now),
    "UNKNOWN",
  );
});
