import api from "./api";
import type { Page } from "@/types";

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  accountDeletedAt?: string;
}

export interface AdminStore {
  id: number;
  name: string;
  description?: string;
  minPersonCount: number;
  maxPersonCount?: number;
  status: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  seller?: {
    id: number;
    companyTitle: string;
    authorizedPerson: string;
    phone: string;
  };
}

export interface AuditEntry {
  id: number;
  action: string;
  entityType: string;
  actorId: string;
  actorRole: string;
  oldValue: string;
  newValue: string;
  correlationId: string;
  timestamp: string;
}

export interface AdminUserDetail {
  user: AdminUser;
  addresses: Array<{
    id: number;
    title: string;
    city: string;
    district: string;
    fullAddress?: string;
  }>;
  subscriptions: Array<{
    id: number;
    storeId: number;
    status: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    personCount: number;
  }>;
  complaints: Array<{
    id: number;
    reason: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  customerProfile?: {
    companyName: string;
    taxNumber: string;
    taxOffice: string;
    invoiceAddress: string;
  };
  sellerProfile?: {
    companyTitle: string;
    taxNumber: string;
    taxOffice: string;
    authorizedPerson: string;
    phone: string;
    iban: string;
  };
  audits: AuditEntry[];
}

export interface AdminStoreDetail {
  store: AdminStore;
  serviceAreas: Array<{
    id: number;
    city: string;
    district: string;
  }>;
  subscriptions: Array<{
    id: number;
    status: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    personCount: number;
  }>;
  complaints: Array<{
    id: number;
    reason: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  audits: AuditEntry[];
}

export interface AdminSubscription {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  storeId: number;
  storeName: string;
  menuName: string;
  status: string;
  startDate: string;
  endDate: string;
  nextDeliveryDate?: string;
  deliveryTime: string;
  personCount: number;
  serviceDayCount: number;
  totalAmount: number;
  discountAmount: number;
  couponCode?: string;
  cancellationReason?: string;
  createdAt: string;
  approvedAt?: string;
  cancelledAt?: string;
}

export interface AdminSubscriptionDetail {
  subscription: AdminSubscription;
  deliveryAddress: string;
  deliveries: Array<{
    id: number;
    deliveryDate: string;
    deliveryTime: string;
    personCount: number;
    status: string;
    address: string;
    notes?: string;
    changeReason?: string;
    changedAt?: string;
    statusChangedAt?: string;
  }>;
  events: Array<{
    id: number;
    action: string;
    oldValue?: string;
    newValue?: string;
    timestamp: string;
  }>;
}

export interface AdminPayment {
  id: number;
  subscriptionId: number;
  customerId: number;
  customerName: string;
  storeId: number;
  storeName: string;
  status: string;
  provider: string;
  currency: string;
  grossAmount: number;
  commissionAmount: number;
  refundedAmount: number;
  netAmount: number;
  failureMessage?: string;
  paidAt?: string;
  createdAt: string;
  refunds: Array<{
    id: number;
    status: string;
    amount: number;
    currency: string;
    reason: string;
    refundedAt?: string;
    createdAt: string;
  }>;
}

export interface AdminPayout {
  id: number;
  storeId: number;
  storeName: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  grossAmount: number;
  commissionAmount: number;
  refundAmount: number;
  adjustmentAmount: number;
  netAmount: number;
  providerPayoutId?: string;
  scheduledAt?: string;
  paidAt?: string;
}
export interface CommissionRule {
  id: number;
  storeId?: number;
  storeName: string;
  commissionRate: number;
  commissionVatRate: number;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
}
export interface PlatformSettings {
  SUBSCRIPTION_APPROVAL_SLA_HOURS: number;
  MIN_SUBSCRIPTION_SERVICE_DAYS: number;
}

export interface AdminComplaintContext {
  delivery?: { id: number; date: string; time: string; status: string };
  payment?: { id: number; status: string; amount: number; currency: string };
}

export interface AdminComplaint {
  id: number;
  reason: string;
  description: string;
  status: string;
  adminNote?: string;
  sellerResponse?: string;
  escalatedAt?: string;
  attachmentUrls?: string;
  createdAt: string;
  customer?: { firstName: string; lastName: string };
  store?: { name: string };
  subscription?: { id: number };
  delivery?: { id: number };
  customerMessage?: string;
  internalNote?: string;
  resolutionType?: string;
  resolutionAmount?: number;
  compensationCode?: string;
  resolvedAt?: string;
}

export interface AdminSellerDocument {
  id: number;
  storeId: number;
  storeName: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  expiryDate?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
  rejectionReason?: string;
  fileSize?: number;
  contentType?: string;
  contractAccepted: boolean;
  readyForPublication: boolean;
  missingDocumentTypes: string[];
  expiringDocumentTypes: string[];
  publicationBlockReason?: string;
}
export interface AdminOperationsSummary {
  openComplaints: number;
  slaComplaints: number;
  delayedDeliveries: number;
  failedPayments: number;
  paymentReviewRequired: boolean;
  pendingSubscriptions: number;
  openRiskCases: number;
  taskCount: number;
  alerts: Array<{ type: string; id: number; title: string; detail: string }>;
  generatedAt: string;
}
export interface FinanceReconciliation {
  id: number;
  date: string;
  providerCollectedAmount: number | null;
  ledgerCollectedAmount: number;
  paidPayoutAmount: number;
  discrepancyAmount: number | null;
  status: string;
  assignedAdmin: string;
  resolutionNote: string;
}
export interface RiskCaseItem {
  id: number;
  type: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  referenceType: string;
  referenceId: number;
  summary: string;
  status: "OPEN" | "ACKNOWLEDGED" | "DISMISSED";
  note: string;
  createdAt: string;
  resolvedAt?: string;
  assignedAdminName?: string;
}
export interface AdminSensitiveAction {
  reason: string;
  reauthToken: string;
}

export interface ServiceDemandSummary {
  city: string;
  district: string;
  neighborhood?: string;
  requestCount: number;
}

const sensitiveActionConfig = (action: AdminSensitiveAction) => ({
  params: { reason: action.reason },
  headers: { "X-Reauth-Token": action.reauthToken },
});

export const adminService = {
  getServiceDemands: () =>
    api
      .get<ServiceDemandSummary[]>("/v1/admin/service-demands")
      .then((response) => response.data),
  getOperationsSummary: (
    params: { startDate?: string; endDate?: string; storeId?: number } = {},
  ) =>
    api
      .get<AdminOperationsSummary>("/v1/admin/operations/summary", { params })
      .then((r) => r.data),
  exportOperationsAlerts: (
    params: { startDate?: string; endDate?: string; storeId?: number } = {},
  ) =>
    api
      .get("/v1/admin/operations/export", { params, responseType: "blob" })
      .then((r) => r.data as Blob),
  supportSearch: (term: string) =>
    api
      .get<
        Record<string, unknown>
      >("/v1/admin/support-search", { params: { term } })
      .then((r) => r.data),
  getAuditLogs: (
    params: {
      page?: number;
      size?: number;
      actorId?: number;
      entityType?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
      sort?: string;
    } = {},
  ) =>
    api
      .get<Page<AuditEntry>>("/v1/admin/audit-logs", {
        params: { page: 0, size: 20, sort: "timestamp,desc", ...params },
      })
      .then((r) => r.data),
  getUsers: (
    page = 0,
    size = 20,
    role?: string,
    search?: string,
    sort?: string,
  ) =>
    api
      .get<Page<AdminUser>>("/v1/admin/users", {
        params: { page, size, role, search, sort },
      })
      .then((r) => r.data),

  getUserDetail: (id: number) =>
    api.get<AdminUserDetail>(`/v1/admin/users/${id}`).then((r) => r.data),

  updateUser: (id: number, data: Record<string, unknown>) =>
    api.put<AdminUser>(`/v1/admin/users/${id}`, data).then((r) => r.data),

  deactivateUser: (id: number, action: AdminSensitiveAction) =>
    api
      .post<AdminUser>(
        `/v1/admin/users/${id}/deactivate`,
        null,
        sensitiveActionConfig(action),
      )
      .then((r) => r.data),

  activateUser: (id: number, action: AdminSensitiveAction) =>
    api
      .post<AdminUser>(
        `/v1/admin/users/${id}/activate`,
        null,
        sensitiveActionConfig(action),
      )
      .then((r) => r.data),

  getStores: (
    page = 0,
    size = 20,
    status?: string,
    search?: string,
    sort?: string,
  ) =>
    api
      .get<Page<AdminStore>>("/v1/admin/stores", {
        params: { page, size, status, search, sort },
      })
      .then((r) => r.data),

  getStoreDetail: (id: number) =>
    api.get<AdminStoreDetail>(`/v1/admin/stores/${id}`).then((r) => r.data),

  updateStore: (id: number, data: Record<string, unknown>) =>
    api.put<AdminStore>(`/v1/admin/stores/${id}`, data).then((r) => r.data),

  approveStore: (id: number, action: AdminSensitiveAction) =>
    api
      .post(
        `/v1/admin/stores/${id}/approve`,
        null,
        sensitiveActionConfig(action),
      )
      .then((r) => r.data),

  suspendStore: (id: number, action: AdminSensitiveAction) =>
    api
      .post(
        `/v1/admin/stores/${id}/suspend`,
        null,
        sensitiveActionConfig(action),
      )
      .then((r) => r.data),

  rejectStore: (id: number, action: AdminSensitiveAction) =>
    api
      .post(
        `/v1/admin/stores/${id}/reject`,
        null,
        sensitiveActionConfig(action),
      )
      .then((r) => r.data),

  getSubscriptions: (
    params: {
      page?: number;
      size?: number;
      status?: string;
      search?: string;
      storeId?: number;
      customerId?: number;
      startDate?: string;
      endDate?: string;
    } = {},
  ) =>
    api
      .get<Page<AdminSubscription>>("/v1/admin/subscriptions", {
        params: { page: 0, size: 20, ...params },
      })
      .then((r) => r.data),

  getSubscriptionDetail: (id: number) =>
    api
      .get<AdminSubscriptionDetail>(`/v1/admin/subscriptions/${id}`)
      .then((r) => r.data),

  cancelSubscription: (id: number, reason: string) =>
    api
      .post<AdminSubscription>(`/v1/admin/subscriptions/${id}/cancel`, {
        reason,
      })
      .then((r) => r.data),

  addSubscriptionNote: (id: number, reason: string) =>
    api
      .post<AdminSubscriptionDetail>(`/v1/admin/subscriptions/${id}/notes`, {
        reason,
      })
      .then((r) => r.data),

  correctSubscriptionDelivery: (
    subscriptionId: number,
    deliveryId: number,
    data: {
      reason: string;
      deliveryTime?: string;
      notes?: string;
    },
  ) =>
    api
      .put(
        `/v1/admin/subscriptions/${subscriptionId}/deliveries/${deliveryId}`,
        data,
      )
      .then((r) => r.data),

  getPayments: (
    params: {
      page?: number;
      size?: number;
      status?: string;
      search?: string;
    } = {},
  ) =>
    api
      .get<
        Page<AdminPayment>
      >("/v1/admin/payments", { params: { page: 0, size: 20, ...params } })
      .then((r) => r.data),

  refundPayment: (
    id: number,
    amount: number,
    reason: string,
    reauthToken: string,
  ) =>
    api
      .post<AdminPayment>(
        `/v1/admin/payments/${id}/refunds`,
        { amount, reason },
        { headers: { "X-Reauth-Token": reauthToken } },
      )
      .then((r) => r.data),

  getPayouts: () =>
    api.get<AdminPayout[]>("/v1/admin/payouts").then((r) => r.data),
  payPayout: (id: number, reauthToken: string) =>
    api
      .post<AdminPayout>(`/v1/admin/payouts/${id}/pay`, null, {
        headers: { "X-Reauth-Token": reauthToken },
      })
      .then((r) => r.data),
  getPayoutStatement: (id: number) =>
    api
      .get<Blob>(`/v1/admin/payouts/${id}/statement`, {
        responseType: "blob",
      })
      .then((r) => r.data),
  getCommissionRules: () =>
    api
      .get<CommissionRule[]>(
        "/v1/admin/platform-configuration/commission-rules",
      )
      .then((r) => r.data),
  createCommissionRule: (
    data: {
      storeId?: number;
      commissionRate: number;
      commissionVatRate: number;
      effectiveFrom: string;
    },
    reauthToken: string,
  ) =>
    api
      .post<CommissionRule>(
        "/v1/admin/platform-configuration/commission-rules",
        data,
        { headers: { "X-Reauth-Token": reauthToken } },
      )
      .then((r) => r.data),
  getPlatformSettings: () =>
    api
      .get<PlatformSettings>("/v1/admin/platform-configuration/settings")
      .then((r) => r.data),
  updatePlatformSetting: (
    key: keyof PlatformSettings,
    value: number,
    reauthToken: string,
  ) =>
    api
      .put<PlatformSettings>(
        `/v1/admin/platform-configuration/settings/${key}`,
        { value },
        { headers: { "X-Reauth-Token": reauthToken } },
      )
      .then((r) => r.data),
  getFinanceReconciliations: () =>
    api
      .get<FinanceReconciliation[]>("/v1/admin/finance-reconciliations")
      .then((r) => r.data),
  resolveFinanceReconciliation: (id: number, note: string) =>
    api
      .post<FinanceReconciliation>(
        `/v1/admin/finance-reconciliations/${id}/resolve`,
        { note },
      )
      .then((r) => r.data),

  getRiskCases: () =>
    api.get<RiskCaseItem[]>("/v1/admin/risk-cases").then((r) => r.data),
  decideRiskCase: (
    id: number,
    decision: "ACKNOWLEDGED" | "DISMISSED" | "REOPENED",
    note: string,
  ) =>
    api
      .post<RiskCaseItem>(`/v1/admin/risk-cases/${id}/decision`, {
        decision,
        note,
      })
      .then((r) => r.data),

  getComplaints: (page = 0, size = 30) =>
    api
      .get<
        Page<AdminComplaint>
      >("/v1/admin/complaints", { params: { page, size } })
      .then((r) => r.data),

  updateComplaint: (
    id: number,
    data: { status?: string; adminNote?: string },
  ) =>
    api
      .put<AdminComplaint>(`/v1/admin/complaints/${id}`, data)
      .then((r) => r.data),

  resolveComplaint: (
    id: number,
    data: {
      resolutionType: string;
      reason: string;
      customerMessage: string;
      internalNote?: string;
      amount?: number;
      compensationDate?: string;
    },
  ) =>
    api
      .post<AdminComplaint>(`/v1/admin/complaints/${id}/resolve`, data)
      .then((r) => r.data),

  getComplaintAttachments: (id: number) =>
    api
      .get<
        Array<{
          id: number;
          fileName: string;
          contentType: string;
          fileSize: number;
          fileUrl: string;
        }>
      >(`/v1/admin/complaints/${id}/attachments`)
      .then((r) => r.data),

  getComplaintContext: (id: number) =>
    api
      .get<AdminComplaintContext>(`/v1/admin/complaints/${id}/context`)
      .then((r) => r.data),

  getSellerDocuments: (status?: string) =>
    api
      .get<
        AdminSellerDocument[]
      >("/v1/admin/seller-documents", { params: { status } })
      .then((r) => r.data),

  reviewSellerDocument: (id: number, approve: boolean, reason?: string) =>
    api
      .patch(`/v1/admin/seller-documents/${id}/review`, { approve, reason })
      .then((r) => r.data),

  getSellerDocumentHistory: (id: number) =>
    api
      .get<AuditEntry[]>(`/v1/admin/seller-documents/${id}/history`)
      .then((r) => r.data),

  openProtectedFile: async (fileUrl: string) => {
    const path = fileUrl.startsWith("/api/") ? fileUrl.slice(4) : fileUrl;
    const response = await api.get<Blob>(path, { responseType: "blob" });
    const objectUrl = URL.createObjectURL(response.data);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  },
};
