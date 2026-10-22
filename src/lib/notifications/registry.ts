import type { NotificationDeliveryProvider } from "@/lib/notifications/types";

const providers: NotificationDeliveryProvider[] = [];

export function registerNotificationProvider(
  provider: NotificationDeliveryProvider,
): void {
  if (!provider.id.trim()) {
    throw new Error("Notification providers require a stable ID.");
  }
  if (providers.some((registered) => registered.id === provider.id)) {
    throw new Error(`Notification provider ${provider.id} is already registered.`);
  }
  providers.push(provider);
}

export function getNotificationProviders(): readonly NotificationDeliveryProvider[] {
  return providers;
}
