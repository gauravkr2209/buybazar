export type PriceAlertNotice = {
  notificationId: string;
  userId: string;
  recipient: string;
  productName: string;
  targetPriceInr: string;
  observationPriceInr: string;
  sourceName: string;
  observedAt: Date;
};

export type NotificationDeliveryProvider = {
  id: string;
  isConfigured(): boolean;
  deliver(notice: PriceAlertNotice): Promise<{ deliveredAt: Date }>;
};
