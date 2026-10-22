import { toNextJsHandler } from "better-auth/next-js";
import { authIsConfigured, getAuth } from "@/lib/auth";
import { serviceUnavailable } from "@/lib/api-response";

function unavailable() {
  return serviceUnavailable(
    "Authentication is not configured. Set DATABASE_URL, BETTER_AUTH_URL, and a 32-character BETTER_AUTH_SECRET.",
  );
}

export function GET(request: Request) {
  if (!authIsConfigured()) return unavailable();
  return toNextJsHandler(getAuth()).GET(request);
}

export function POST(request: Request) {
  if (!authIsConfigured()) return unavailable();
  return toNextJsHandler(getAuth()).POST(request);
}
