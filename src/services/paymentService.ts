import api from "./api";

export interface PaymentMethod {
  id: number;
  brand: string;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  defaultMethod: boolean;
  expiringSoon?: boolean;
}
export interface Payment {
  id: number;
  subscriptionId: number;
  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED"
    | "PARTIALLY_REFUNDED"
    | "REFUNDED";
  currency: string;
  grossAmount: number;
  balanceAmount: number;
  cardAmount: number;
  campaignContribution: number;
  commissionAmount: number;
  refundedAmount: number;
  netAmount: number;
  cardLabel?: string;
  failureMessage?: string;
  paidAt?: string;
  createdAt: string;
}
export interface Refund {
  id: number;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  amount: number;
  currency: string;
  reason?: string;
  refundedAt?: string;
}
export interface PaymentSummary {
  subscriptionId: number;
  orderTotal: number;
  paidAmount: number;
  refundedAmount: number;
  refundableAmount: number;
  currency: string;
  payment?: Payment;
  refunds: Refund[];
  invoiceId?: number;
}
export interface MealBalanceTransaction {
  id: number;
  type:
    | "DELIVERY_REDUCTION_CREDIT"
    | "DELIVERY_INCREASE_DEBIT"
    | "WEEKLY_CHARGE_DEBIT"
    | "PAYMENT_FAILURE_REVERSAL";
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}
export interface MealBalance {
  availableAmount: number;
  currency: string;
  recentTransactions: MealBalanceTransaction[];
}
export interface Payout {
  id: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  adjustmentAmount?: number;
  netAmount: number;
  scheduledAt?: string;
  paidAt?: string;
}
export interface SellerFinanceMovement {
  id: number;
  subscriptionId: number;
  status: Payment["status"];
  currency: string;
  refundedAmount: number;
  netAmount: number;
  createdAt: string;
}
export interface FinanceSummary {
  refunds: number;
  netEarnings: number;
  pendingPayout: number;
  scheduledPayout: number;
  paidPayout: number;
  currency: string;
  movements: SellerFinanceMovement[];
  payouts: Payout[];
}

export const paymentService = {
  async methods(): Promise<PaymentMethod[]> {
    return (await api.get("/v1/payments/methods")).data;
  },
  async addMethod(input: {
    providerToken: string;
    cardHolderName: string;
    brand: string;
    lastFour: string;
    expiryMonth: number;
    expiryYear: number;
    makeDefault: boolean;
  }): Promise<PaymentMethod> {
    return (await api.post("/v1/payments/methods", input)).data;
  },
  async deleteMethod(id: number): Promise<void> {
    await api.delete(`/v1/payments/methods/${id}`);
  },
  async history(): Promise<Payment[]> {
    return (await api.get("/v1/payments/history")).data;
  },
  async mealBalance(): Promise<MealBalance> {
    return (await api.get("/v1/payments/meal-balance")).data;
  },
  async summary(subscriptionId: number): Promise<PaymentSummary> {
    return (await api.get(`/v1/payments/subscriptions/${subscriptionId}`)).data;
  },
  async retry(paymentId: number): Promise<Payment> {
    return (await api.post(`/v1/payments/${paymentId}/retry`)).data;
  },
  invoiceUrl(invoiceId: number, download = false) {
    return `/api/v1/payments/invoices/${invoiceId}?download=${download}`;
  },
  async downloadInvoice(invoiceId: number): Promise<void> {
    const response = await api.get(`/v1/payments/invoices/${invoiceId}`, {
      params: { download: true },
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mealflex-dekont-${invoiceId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
  async finance(
    storeId: number,
    startDate: string,
    endDate: string,
  ): Promise<FinanceSummary> {
    return (
      await api.get(`/v1/seller/stores/${storeId}/finance`, {
        params: { startDate, endDate },
      })
    ).data;
  },
};
