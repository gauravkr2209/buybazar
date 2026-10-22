import { headers } from "next/headers";
import { authIsConfigured, getAuth } from "@/lib/auth";

export async function getAuthenticatedUserId(): Promise<string | null> {
  if (!authIsConfigured()) return null;
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}
