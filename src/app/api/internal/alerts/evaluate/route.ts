import { databaseIsConfigured } from "@/lib/database-config";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { evaluatePriceAlerts } from "@/lib/alerts/evaluate";

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET) {
    return serviceUnavailable("Set CRON_SECRET before enabling scheduled alert evaluation.");
  }
  if (!isAuthorizedCronRequest(request)) {
    return apiError("Unauthorized scheduled-job request.", 401);
  }
  if (!databaseIsConfigured()) {
    return serviceUnavailable("Configure Firebase before evaluating price alerts.");
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  if (cursor !== undefined && !/^[a-zA-Z0-9_-]{1,64}$/.test(cursor)) {
    return apiError("Invalid alert evaluation cursor.", 400);
  }
  const result = await evaluatePriceAlerts(cursor);
  return Response.json({
    ...result,
    delivery: "queued-only",
    note: "No email or push provider is configured; notifications have not been delivered. Repeat with nextCursor until it is null.",
  });
}
