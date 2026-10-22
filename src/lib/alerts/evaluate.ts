import { prisma } from "@/lib/prisma";

const OBSERVATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function evaluatePriceAlerts(afterId?: string) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - OBSERVATION_MAX_AGE_MS);
  const alerts = await prisma.targetPriceAlert.findMany({
    where: { enabled: true },
    orderBy: { id: "asc" },
    take: 500,
    ...(afterId ? { cursor: { id: afterId }, skip: 1 } : {}),
    select: {
      id: true,
      userId: true,
      productId: true,
      targetPrice: true,
    },
  });
  if (alerts.length === 0) {
    return { evaluated: 0, queued: 0, nextCursor: null };
  }

  const productIds = [...new Set(alerts.map((alert) => alert.productId))];
  const eligibleObservations = {
    productId: { in: productIds },
    isDemo: false,
    availability: "AVAILABLE" as const,
    currency: "INR",
    observedAt: { gte: cutoff, lte: now },
    freshnessExpiresAt: { gt: now },
  };
  const productMinimums = await prisma.priceObservation.groupBy({
    by: ["productId"],
    where: {
      ...eligibleObservations,
    },
    _min: { price: true },
  });
  const minima = productMinimums.flatMap(({ productId, _min }) =>
    _min.price === null ? [] : [{ productId, price: _min.price }],
  );
  const observations = minima.length
    ? await prisma.priceObservation.findMany({
        where: {
          ...eligibleObservations,
          OR: minima,
        },
        orderBy: [{ productId: "asc" }, { observedAt: "desc" }],
        select: {
          id: true,
          productId: true,
          price: true,
          currency: true,
          observedAt: true,
        },
      })
    : [];

  const lowestFreshObservation = new Map<
    string,
    (typeof observations)[number]
  >();
  for (const observation of observations) {
    if (!lowestFreshObservation.has(observation.productId)) {
      lowestFreshObservation.set(observation.productId, observation);
    }
  }

  const notifications = alerts.flatMap((alert) => {
    const observation = lowestFreshObservation.get(alert.productId);
    if (!observation || observation.price.greaterThan(alert.targetPrice)) return [];
    return [{
      alertId: alert.id,
      userId: alert.userId,
      productId: alert.productId,
      observationId: observation.id,
      status: "PENDING" as const,
      message:
        "A fresh verified price observation met your target. Review the product page for the source and timestamp.",
    }];
  });

  const queued = notifications.length
    ? await prisma.alertNotification.createMany({
        data: notifications,
        skipDuplicates: true,
      })
    : { count: 0 };

  return {
    evaluated: alerts.length,
    queued: queued.count,
    nextCursor: alerts.length === 500 ? alerts[alerts.length - 1]?.id ?? null : null,
  };
}
