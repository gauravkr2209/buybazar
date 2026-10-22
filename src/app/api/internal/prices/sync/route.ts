import { databaseIsConfigured } from "@/lib/database-config";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { getProviderAdapters } from "@/lib/providers/registry";
import { ProviderRequestError } from "@/lib/providers/types";
import { synchronizeProvider } from "@/lib/providers/sync";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return serviceUnavailable("Set CRON_SECRET before enabling scheduled price synchronization.");
  }
  if (!isAuthorizedCronRequest(request)) {
    return apiError("Unauthorized synchronization request.", 401);
  }
  if (!databaseIsConfigured()) {
    return serviceUnavailable("Configure the database before synchronizing prices.");
  }

  const configuredAdapters = getProviderAdapters().filter((adapter) => adapter.isConfigured());
  if (configuredAdapters.length === 0) {
    return serviceUnavailable(
      "No authorized provider adapter is configured. No price data was fetched or changed.",
    );
  }
  const providerProducts = await prisma.product.findMany({
    where: { isDemo: false, identifiers: { some: {} } },
    orderBy: { slug: "asc" },
    take: 500,
    select: {
      slug: true,
      brand: true,
      variantKey: true,
      identifiers: { select: { type: true, value: true } },
    },
  });
  if (providerProducts.length === 0) {
    return serviceUnavailable(
      "No non-demo products have authorized identifiers registered. No price data was fetched or changed.",
    );
  }
  const syncRequests = providerProducts.map(({ slug, ...product }) => ({
    ...product,
    productSlug: slug,
  }));

  const results = [];
  for (const adapter of configuredAdapters) {
    try {
      const result = await synchronizeProvider(adapter, syncRequests);
      results.push({ provider: adapter.id, ...result });
    } catch (error) {
      if (error instanceof ProviderRequestError) {
        console.error(`Provider ${adapter.id} synchronization failed with status ${error.status}.`);
        return apiError(
          `Provider ${adapter.id} synchronization failed. Any earlier providers may have stored observations.`,
          502,
        );
      }
      if (error instanceof TypeError) {
        console.error(`Provider ${adapter.id} synchronization failed due to a network error.`);
        return apiError(
          `Provider ${adapter.id} synchronization failed. Any earlier providers may have stored observations.`,
          502,
        );
      }
      throw error;
    }
  }
  return Response.json({ results });
}
