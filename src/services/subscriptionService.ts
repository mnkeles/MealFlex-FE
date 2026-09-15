import api from "./api";
import type { PaymentMethod } from "./paymentService";
import type {
  Subscription,
  SubscriptionStatus,
  Page,
  SubscriptionPreview,
  CustomerSubscriptionDetail,
  Review,
  CustomerComplaint,
  SubscriptionEvent,
} from "@/types";

export interface SubscriptionInput {
  storeId: number;
  menuId: number;
  addressId: number;
  personCount: number;
  deliveryTime: string;
  startDate: string;
  endDate: string;
  paymentMethodId?: number;
  commercialTermsAccepted?: boolean;
  recurringPaymentConsent?: boolean;
  couponCode?: string;
}

export interface DeliveryChangeResult {
  subscriptionId: number;
  startDate: string;
  endDate: string;
  affectedDeliveryCount: number;
  adjustmentAmount: number;
  currency: string;
  adjustmentStatus: string;
}
export interface DeliveryModificationInput {
  addressId?: number;
  deliveryTime?: string;
  personCount?: number;
  customerNote?: string;
}
export interface DeliveryModificationResult {
  deliveryId: number;
  deliveryDate: string;
  addressId: number;
  menuId: number;
  deliveryTime: string;
  personCount: number;
  oldDailyAmount: number;
  newDailyAmount: number;
  priceDifference: number;
  financialAction: "CHARGE" | "REFUND" | "NONE";
  applied: boolean;
}
export interface DeliveryModificationRequestResult {
  id: number;
  subscriptionId: number;
  deliveryId: number;
  customerName?: string;
  deliveryDate: string;
  requestType: "CHANGE" | "SKIP";
  oldDeliveryTime: string;
  requestedDeliveryTime: string;
  oldPersonCount: number;
  requestedPersonCount: number;
  oldAddressId?: number;
  requestedAddressId?: number;
  oldAddress?: string;
  requestedAddress?: string;
  priceDifference: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "APPLIED";
  decisionReason?: string;
  customerNote?: string;
  requestedAt: string;
  decidedAt?: string;
}
export interface SubscriptionExtensionRequestResult {
  id: number;
  subscriptionId: number;
  customerName: string;
  menuName: string;
  personCount: number;
  oldEndDate: string;
  newEndDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decisionReason?: string;
  requestedAt: string;
  decidedAt?: string;
}

export const subscriptionService = {
  async create(
    data: SubscriptionInput,
    idempotencyKey: string,
  ): Promise<Subscription> {
    const response = await api.post("/v1/subscriptions", data, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
    return response.data;
  },

  async preview(data: SubscriptionInput): Promise<SubscriptionPreview> {
    const response = await api.post("/v1/subscriptions/preview", data);
    return response.data;
  },

  async getMySubscriptions(
    status?: SubscriptionStatus,
    page = 0,
    size = 10,
    statuses?: SubscriptionStatus[],
  ): Promise<Page<Subscription>> {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;
    if (statuses?.length) params.statuses = statuses.join(",");
    const response = await api.get("/v1/subscriptions", { params });
    return response.data;
  },

  async getSubscription(id: number): Promise<CustomerSubscriptionDetail> {
    const response = await api.get(`/v1/subscriptions/${id}`);
    return response.data;
  },

  async changePaymentMethod(
    subscriptionId: number,
    paymentMethodId: number,
  ): Promise<PaymentMethod> {
    return (
      await api.patch(`/v1/subscriptions/${subscriptionId}/payment-method`, {
        paymentMethodId,
      })
    ).data;
  },

  async extend(
    id: number,
    newEndDate: string,
  ): Promise<SubscriptionExtensionRequestResult> {
    return (await api.post(`/v1/subscriptions/${id}/extend`, { newEndDate }))
      .data;
  },

  async getExtensionRequests(
    subscriptionId: number,
  ): Promise<SubscriptionExtensionRequestResult[]> {
    return (
      await api.get(`/v1/subscriptions/${subscriptionId}/extension-requests`)
    ).data;
  },

  async setAutoRenew(id: number, enabled: boolean): Promise<Subscription> {
    return (await api.patch(`/v1/subscriptions/${id}/auto-renew`, { enabled }))
      .data;
  },

  async getSubscriptionEvents(id: number): Promise<SubscriptionEvent[]> {
    const response = await api.get(`/v1/subscriptions/${id}/events`);
    return response.data;
  },

  async cancel(id: number, reason?: string): Promise<Subscription> {
    const response = await api.post(`/v1/subscriptions/${id}/cancel`, null, {
      params: { reason },
    });
    return response.data;
  },

  async skipDelivery(
    subscriptionId: number,
    deliveryId: number,
    reason?: string,
  ): Promise<DeliveryModificationRequestResult> {
    return (
      await api.post(
        `/v1/subscriptions/${subscriptionId}/deliveries/${deliveryId}/skip`,
        null,
        { params: { reason } },
      )
    ).data;
  },

  async freeze(
    subscriptionId: number,
    startDate: string,
    endDate: string,
    reason?: string,
  ): Promise<DeliveryChangeResult> {
    return (
      await api.post(`/v1/subscriptions/${subscriptionId}/freeze`, {
        startDate,
        endDate,
        reason,
      })
    ).data;
  },

  async previewDeliveryChange(
    subscriptionId: number,
    deliveryId: number,
    input: DeliveryModificationInput,
  ): Promise<DeliveryModificationResult> {
    return (
      await api.post(
        `/v1/subscriptions/${subscriptionId}/deliveries/${deliveryId}/change-preview`,
        input,
      )
    ).data;
  },

  async changeDelivery(
    subscriptionId: number,
    deliveryId: number,
    input: DeliveryModificationInput,
  ): Promise<DeliveryModificationRequestResult> {
    return (
      await api.post(
        `/v1/subscriptions/${subscriptionId}/deliveries/${deliveryId}/change`,
        input,
      )
    ).data;
  },

  async getDeliveryChangeRequests(
    subscriptionId: number,
  ): Promise<DeliveryModificationRequestResult[]> {
    return (
      await api.get(
        `/v1/subscriptions/${subscriptionId}/delivery-change-requests`,
      )
    ).data;
  },

  async createReview(
    subscriptionId: number,
    rating: number,
    comment: string,
  ): Promise<Review> {
    const response = await api.post("/v1/reviews", {
      subscriptionId,
      rating,
      comment,
    });
    return response.data;
  },

  async createComplaint(data: {
    subscriptionId: number;
    deliveryId?: number;
    reason: string;
    description: string;
  }): Promise<CustomerComplaint> {
    const response = await api.post("/v1/complaints", data);
    return response.data;
  },

  async uploadComplaintAttachment(
    complaintId: number,
    file: File,
  ): Promise<void> {
    const form = new FormData();
    form.append("file", file);
    await api.post(`/v1/complaints/${complaintId}/attachments`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  async getComplaints(page = 0, size = 20): Promise<Page<CustomerComplaint>> {
    const response = await api.get("/v1/complaints", {
      params: { page, size },
    });
    return response.data;
  },
};
