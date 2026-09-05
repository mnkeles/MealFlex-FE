export interface NotificationReference {
  referenceType?: string;
  referenceId?: number;
}

export function getNotificationLink(
  item: NotificationReference,
  role: "CUSTOMER" | "SELLER",
) {
  if (!item.referenceId) return undefined;
  if (role === "CUSTOMER") {
    if (item.referenceType === "SUBSCRIPTION")
      return `/subscriptions/${item.referenceId}`;
    if (item.referenceType === "SUBSCRIPTION_DELIVERY")
      return `/subscriptions/${item.referenceId}#deliveries`;
    if (item.referenceType === "DELIVERY_CHANGE_REQUEST")
      return `/subscriptions/${item.referenceId}`;
    if (item.referenceType === "COMPLAINT") return "/support";
    if (item.referenceType === "PAYMENT" || item.referenceType === "REFUND")
      return "/payments";
  }
  if (role === "SELLER" && item.referenceType === "SUBSCRIPTION") {
    return `/seller/dashboard?subscriptionId=${item.referenceId}`;
  }
  return undefined;
}
