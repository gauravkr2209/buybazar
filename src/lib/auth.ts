import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { databaseIsConfigured } from "@/lib/database-config";
import { prisma } from "@/lib/prisma";

export function authIsConfigured(): boolean {
  return Boolean(
    databaseIsConfigured() &&
      process.env.BETTER_AUTH_SECRET &&
      process.env.BETTER_AUTH_SECRET.length >= 32 &&
      process.env.BETTER_AUTH_URL,
  );
}

function createAuth() {
  if (!databaseIsConfigured()) {
    throw new Error("Authentication is unavailable until its environment is configured.");
  }
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !baseURL) {
    throw new Error("Authentication is unavailable until its environment is configured.");
  }
  return betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    secret,
    baseURL,
    emailAndPassword: { enabled: true },
    plugins: [nextCookies()],
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth(): ReturnType<typeof createAuth> {
  if (!authIsConfigured()) {
    throw new Error("Authentication is unavailable until its environment is configured.");
  }
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}
