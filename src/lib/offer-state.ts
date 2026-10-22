export type OfferDataState =
  | "DEMO"
  | "FRESH"
  | "STALE"
  | "UNAVAILABLE"
  | "UNKNOWN";

export function getOfferDataState(
  offer: {
    isDemo: boolean;
    availability: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
    freshnessExpiresAt: Date | null;
  },
  now = new Date(),
): OfferDataState {
  if (offer.isDemo) return "DEMO";
  if (offer.availability === "UNAVAILABLE") return "UNAVAILABLE";
  if (offer.availability !== "AVAILABLE") return "UNKNOWN";
  if (!offer.freshnessExpiresAt || offer.freshnessExpiresAt <= now) return "STALE";
  return "FRESH";
}
