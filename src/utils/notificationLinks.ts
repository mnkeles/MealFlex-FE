export interface NotificationReference {
  referenceType?: string;
  referenceId?: number;
  targetUrl?: string;
}

export function getNotificationLink(
  item: NotificationReference,
  role: "CUSTOMER" | "SELLER" | "ADMIN",
) {
  if (item.targetUrl) return item.targetUrl;
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
  if (role === "SELLER") {
    if (item.referenceType === "STORE") return `/seller/stores/${item.referenceId}/dashboard`;
    if (item.referenceType === "ACCOUNT") return "/seller/security";
  }
  if (role === "ADMIN") {
    if (item.referenceType === "STORE") return `/admin/stores/${item.referenceId}`;
    if (item.referenceType === "COMPLAINT") return "/admin/complaints";
    if (item.referenceType === "PAYMENT" || item.referenceType === "REFUND") return "/admin/finance";
    if (item.referenceType === "SUBSCRIPTION") return "/admin/subscriptions";
  }
  return undefined;
}
