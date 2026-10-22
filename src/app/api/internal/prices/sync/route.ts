import { databaseIsConfigured } from "@/lib/database-config";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getProviderAdapters } from "@/lib/providers/registry";
import { ProviderRequestError } from "@/lib/providers/types";
import { synchronizeProvider } from "@/lib/providers/sync";

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return serviceUnavailable("Set CRON_SECRET before enabling scheduled price synchronization.");
  }
  if (!isAuthorizedCronRequest(request)) {
    return apiError("Unauthorized synchronization request.", 401);
  }
  if (!databaseIsConfigured()) {
    return serviceUnavailable("Configure Firebase before synchronizing prices.");
  }

  const configuredAdapters = getProviderAdapters().filter((adapter) => adapter.isConfigured());
  if (configuredAdapters.length === 0) {
    return serviceUnavailable(
      "No authorized provider adapter is configured. No price data was fetched or changed.",
    );
  }
  const productsSnapshot = await getFirebaseFirestore()
    .collection("products")
    .where("isDemo", "==", false)
    .orderBy("slug", "asc")
    .limit(500)
    .get();
  const providerProducts = productsSnapshot.docs.flatMap((document) => {
    const product = document.data();
    const identifiers = Array.isArray(product.identifiers)
      ? product.identifiers.filter((identifier: unknown) =>
          typeof identifier === "object" &&
          identifier !== null &&
          "type" in identifier &&
          typeof identifier.type === "string" &&
          "value" in identifier &&
          typeof identifier.value === "string",
        )
      : [];
    if (identifiers.length === 0) return [];
    return [{
      productSlug: document.id,
      brand: String(product.brand ?? ""),
      variantKey: String(product.variantKey ?? ""),
      identifiers: identifiers.map((identifier: { type: string; value: string }) => ({
        type: identifier.type,
        value: identifier.value,
      })),
    }];
  });
  if (providerProducts.length === 0) {
    return serviceUnavailable(
      "No non-demo products have authorized identifiers registered. No price data was fetched or changed.",
    );
  }
  const results = [];
  for (const adapter of configuredAdapters) {
    try {
      const result = await synchronizeProvider(adapter, providerProducts);
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
