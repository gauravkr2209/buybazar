import type { ProviderAdapter } from "@/lib/providers/types";

const adapters: ProviderAdapter[] = [];

export function registerProviderAdapter(adapter: ProviderAdapter): void {
  if (!adapter.id.trim() || adapter.minimumIntervalMs < 0) {
    throw new Error("Provider adapters require an ID and a non-negative request interval.");
  }
  if (adapters.some((registered) => registered.id === adapter.id)) {
    throw new Error(`Provider adapter ${adapter.id} is already registered.`);
  }
  adapters.push(adapter);
}

export function getProviderAdapters(): readonly ProviderAdapter[] {
  return adapters;
}
