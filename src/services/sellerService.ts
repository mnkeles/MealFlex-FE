import api from "./api";
import type {
  Store,
  Menu,
  BusinessHour,
  Subscription,
  Delivery,
  DeliveryStatus,
  Page,
  SubscriptionStatus,
  SubscriptionEvent,
} from "@/types";

export interface DistanceRule {
  id?: number;
  distanceKm: number;
  minPersonCount: number;
}

export interface SellerProfile {
  id: number;
  companyTitle: string;
  taxNumber: string;
  taxOffice: string;
  authorizedPerson: string;
  phone?: string;
  bankName?: string;
  iban?: string;
}

export interface BankCatalogItem {
  id: number;
  name: string;
  legalName: string;
  bankType: "MEVDUAT" | "KATILIM";
}

export interface ServiceArea {
  id: number;
  city: string;
  district: string;
}

export interface ClosedDate {
  id: number;
  closedDate: string;
  reason?: string;
}

export interface ReviewItem {
  id: number;
  customerName: string;
  rating: number;
  comment?: string;
  sellerReply?: string;
  sellerRepliedAt?: string;
  createdAt: string;
}

export interface ComplaintItem {
  id: number;
  customerName?: string;
  reason: string;
  description: string;
  status: import("@/constants/complaintStatus").ComplaintStatus;
  adminNote?: string;
  createdAt: string;
  subscriptionId?: number;
  deliveryId?: number;
  sellerResponse?: string;
  escalatedAt?: string;
  attachmentUrls?: string;
}

export type SellerProfileCreateRequest = Omit<SellerProfile, "id">;
export type SellerProfileUpdateRequest = Pick<
  SellerProfile,
  "companyTitle" | "authorizedPerson"
> &
  Partial<Pick<SellerProfile, "phone" | "bankName" | "iban">>;

export interface DocumentItem {
  id: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  expiryDate?: string;
  verified: boolean;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  fileSize?: number;
  contentType?: string;
}

export interface StoreOnboarding {
  completedSteps: number;
  totalSteps: number;
  contractAccepted: boolean;
  readyForPublication: boolean;
  missingDocumentTypes: string[];
  expiringDocumentTypes: string[];
  publicationBlockReason?: string;
}
export interface StoreStaff {
  id: number;
  email: string;
  fullName?: string;
  role: string;
  status: string;
  permissions: string[];
  invitationExpiresAt?: string;
}
export interface Campaign {
  id: number;
  name: string;
  code?: string;
  campaignType: string;
  discountValue: number;
  minAmount?: number;
  maxUsesPerCustomer: number;
  firstSubscriptionOnly: boolean;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface StoreAddressPayload {
  productionAddress?: string;
  addressTitle?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  directions?: string;
  latitude: number;
  longitude: number;
}

export interface StoreAnalytics {
  rating: number;
  reviewCount: number;
  deliveryTrend: { date: string; deliveryCount: number; personCount: number }[];
  popularMenus: {
    menuId: number;
    menuName: string;
    deliveryCount: number;
    personCount: number;
  }[];
  ratingDistribution: Record<string, number>;
}

export interface SellerSubscriptionDetail {
  subscription: Subscription;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: string;
  deliveries: Delivery[];
}

export interface DeliveryChangeRequest {
  id: number;
  subscriptionId: number;
  deliveryId: number;
  customerName: string;
  deliveryDate: string;
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
  requestedAt: string;
}

export interface DeliveryStatusUpdate {
  status: DeliveryStatus;
  estimatedDeliveryAt?: string;
  notes?: string;
  receiverName?: string;
  deliveryCode?: string;
  proofPhotoUrl?: string;
  failureReason?: string;
  delayMinutes?: number;
  courierLatitude?: number;
  courierLongitude?: number;
}
export interface RoutePlan {
  storeId: number;
  method: string;
  stops: Array<{
    deliveryId: number;
    suggestedSequence: number;
    deliveryTime: string;
    address: string;
    distanceKmFromPrevious: number;
    estimatedTravelMinutes: number;
    note: string;
  }>;
}

export interface ProductionSummary {
  startDate: string;
  endDate: string;
  totalDeliveries: number;
  totalPortions: number;
  days: {
    date: string;
    deliveryCount: number;
    portions: number;
    closedDateId?: number;
    closedReason?: string;
  }[];
  menus: {
    menuId: number;
    menuName: string;
    deliveryCount: number;
    portions: number;
  }[];
  timeSlots: {
    deliveryTime: string;
    deliveryCount: number;
    portions: number;
  }[];
  preparationList: Delivery[];
}

export interface MenuVersion {
  id: number;
  versionNumber: number;
  effectiveFrom: string;
  pricePerPerson: number;
  snapshotJson: string;
  subscriptionCount: number;
  createdAt: string;
}

export const sellerService = {
  async getBanks(): Promise<BankCatalogItem[]> {
    const response = await api.get("/v1/seller/banks");
    return response.data;
  },

  async getProfile(): Promise<SellerProfile> {
    const response = await api.get("/v1/seller/profile");
    return response.data;
  },

  async profileExists(): Promise<boolean> {
    const response = await api.get("/v1/seller/profile/exists");
    return response.data;
  },

  async createProfile(
    data: SellerProfileCreateRequest,
  ): Promise<SellerProfile> {
    const response = await api.post("/v1/seller/profile", data);
    return response.data;
  },

  async updateProfile(
    data: SellerProfileUpdateRequest,
  ): Promise<SellerProfile> {
    const response = await api.put("/v1/seller/profile", data);
    return response.data;
  },

  async getMyStore(): Promise<Store> {
    const response = await api.get("/v1/seller/store");
    return response.data;
  },

  async getMyStores(): Promise<Store[]> {
    const response = await api.get("/v1/seller/stores");
    return response.data;
  },

  async getStoreById(storeId: number): Promise<Store> {
    const response = await api.get(`/v1/seller/stores/${storeId}`);
    return response.data;
  },

  async createStore(
    data: StoreAddressPayload & {
      name: string;
      description?: string;
      maxDeliveryDistanceKm: number;
      distanceRules?: { distanceKm: number; minPersonCount: number }[];
      categories?: string[];
    },
  ): Promise<Store> {
    const response = await api.post("/v1/seller/stores", data);
    return response.data;
  },

  async updateStore(
    data: StoreAddressPayload & {
      name: string;
      description?: string;
    },
  ): Promise<Store> {
    const response = await api.put("/v1/seller/store", data);
    return response.data;
  },

  async updateStoreById(
    storeId: number,
    data: StoreAddressPayload & {
      name: string;
      description?: string;
      maxPersonCount?: number;
      changeCutoffHours?: number;
      logoUrl?: string;
      coverImageUrl?: string;
      maxDeliveryDistanceKm?: number;
      distanceRules?: { distanceKm: number; minPersonCount: number }[];
      categories?: string[];
    },
  ): Promise<Store> {
    const response = await api.put(`/v1/seller/stores/${storeId}`, data);
    return response.data;
  },

  async setBusinessHours(
    hours: {
      dayOfWeek: string;
      open: boolean;
      openTime?: string;
      closeTime?: string;
    }[],
  ): Promise<BusinessHour[]> {
    const response = await api.put("/v1/seller/store/business-hours", hours);
    return response.data;
  },

  async setBusinessHoursForStore(
    storeId: number,
    hours: {
      dayOfWeek: string;
      open: boolean;
      openTime?: string;
      closeTime?: string;
    }[],
  ): Promise<BusinessHour[]> {
    const response = await api.put(
      `/v1/seller/stores/${storeId}/business-hours`,
      hours,
    );
    return response.data;
  },

  async getBusinessHours(storeId: number): Promise<BusinessHour[]> {
    const response = await api.get(
      `/v1/seller/stores/${storeId}/business-hours`,
    );
    return response.data;
  },

  async addServiceArea(data: {
    city: string;
    district: string;
  }): Promise<void> {
    await api.post("/v1/seller/store/service-areas", data);
  },

  async addServiceAreaForStore(
    storeId: number,
    data: { city: string; district: string },
  ): Promise<void> {
    await api.post(`/v1/seller/stores/${storeId}/service-areas`, data);
  },

  async getDistanceRules(storeId: number): Promise<DistanceRule[]> {
    const response = await api.get(
      `/v1/seller/stores/${storeId}/distance-rules`,
    );
    return response.data;
  },

  async getMyMenus(): Promise<Menu[]> {
    const response = await api.get("/v1/seller/menus");
    return response.data;
  },

  async uploadStoreImage(
    storeId: number,
    type: "logo" | "cover",
    file: File,
  ): Promise<Store> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/v1/seller/stores/${storeId}/media/${type}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  async uploadMenuImage(menuId: number, file: File): Promise<Menu> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/v1/seller/menus/${menuId}/image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  async uploadMenuGallery(menuId: number, files: File[]): Promise<Menu> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await api.post(
      `/v1/seller/menus/${menuId}/gallery`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  async deleteMenuGalleryImage(menuId: number, imageId: number): Promise<Menu> {
    const response = await api.delete(
      `/v1/seller/menus/${menuId}/gallery/${imageId}`,
    );
    return response.data;
  },

  async setMenuGalleryCover(menuId: number, imageId: number): Promise<Menu> {
    const response = await api.patch(
      `/v1/seller/menus/${menuId}/gallery/${imageId}/cover`,
    );
    return response.data;
  },

  async uploadMenuItemImage(
    menuId: number,
    itemId: number,
    file: File,
  ): Promise<Menu> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/v1/seller/menus/${menuId}/items/${itemId}/image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  async getMenusForStore(storeId: number): Promise<Menu[]> {
    const response = await api.get(`/v1/seller/menus/stores/${storeId}`);
    return response.data;
  },

  async createMenu(data: {
    name: string;
    description?: string;
    pricePerPerson: number;
    allergenInfo?: string;
    imageUrl?: string;
    dietTags?: string[];
    allergens?: string[];
    items?: { id?: number; name: string; description?: string; imageUrl?: string; sortOrder?: number }[];
  }): Promise<Menu> {
    const response = await api.post("/v1/seller/menus", data);
    return response.data;
  },

  async updateMenu(
    id: number,
    data: {
      name: string;
      description?: string;
      pricePerPerson: number;
      allergenInfo?: string;
      imageUrl?: string;
      dietTags?: string[];
      allergens?: string[];
      priceEffectiveFrom?: string;
      items?: { id?: number; name: string; description?: string; imageUrl?: string; sortOrder?: number }[];
    },
  ): Promise<Menu> {
    const response = await api.put(`/v1/seller/menus/${id}`, data);
    return response.data;
  },

  async getSubscriptions(
    status?: SubscriptionStatus,
    page = 0,
    size = 10,
  ): Promise<Page<Subscription>> {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;
    const response = await api.get("/v1/seller/subscriptions", { params });
    return response.data;
  },

  async approveSubscription(id: number): Promise<Subscription> {
    const response = await api.post(`/v1/seller/subscriptions/${id}/approve`);
    return response.data;
  },

  async rejectSubscription(id: number, reason: string): Promise<Subscription> {
    const response = await api.post(
      `/v1/seller/subscriptions/${id}/reject`,
      null,
      { params: { reason } },
    );
    return response.data;
  },

  async getTodaysDeliveries(storeId?: number): Promise<Delivery[]> {
    const path = storeId
      ? `/v1/seller/stores/${storeId}/deliveries/today`
      : "/v1/seller/deliveries/today";
    const response = await api.get(path);
    return response.data;
  },
  async getRoutePlan(storeId: number, date: string): Promise<RoutePlan> {
    const response = await api.get(
      `/v1/seller/stores/${storeId}/deliveries/route-plan`,
      { params: { date } },
    );
    return response.data;
  },

  async copyMenu(id: number): Promise<Menu> {
    const response = await api.post(`/v1/seller/menus/${id}/copy`);
    return response.data;
  },
  async setMenusActive(menuIds: number[], active: boolean): Promise<Menu[]> {
    const response = await api.patch("/v1/seller/menus/bulk-active", {
      menuIds,
      active,
    });
    return response.data;
  },
  async getMenuVersions(id: number): Promise<MenuVersion[]> {
    const response = await api.get(`/v1/seller/menus/${id}/versions`);
    return response.data;
  },

  async getDeliveriesByDate(
    date: string,
    storeId?: number,
  ): Promise<Delivery[]> {
    const path = storeId
      ? `/v1/seller/stores/${storeId}/deliveries`
      : "/v1/seller/deliveries";
    const response = await api.get(path, { params: { date } });
    return response.data;
  },

  async markInTransit(id: number, storeId?: number): Promise<Delivery> {
    const path = storeId
      ? `/v1/seller/stores/${storeId}/deliveries/${id}/in-transit`
      : `/v1/seller/deliveries/${id}/in-transit`;
    const response = await api.post(path);
    return response.data;
  },

  async markAsDelivered(
    id: number,
    deliveryCode: string,
    storeId?: number,
  ): Promise<Delivery> {
    const path = storeId
      ? `/v1/seller/stores/${storeId}/deliveries/${id}/deliver`
      : `/v1/seller/deliveries/${id}/deliver`;
    const response = await api.post(path, { deliveryCode });
    return response.data;
  },

  async updateDeliveryStatus(
    storeId: number,
    id: number,
    data: DeliveryStatusUpdate,
  ): Promise<Delivery> {
    const response = await api.patch(
      `/v1/seller/stores/${storeId}/deliveries/${id}/status`,
      data,
    );
    return response.data;
  },

  async getProductionSummary(
    storeId: number,
    startDate: string,
    endDate: string,
  ): Promise<ProductionSummary> {
    const response = await api.get(
      `/v1/seller/stores/${storeId}/production-summary`,
      { params: { startDate, endDate } },
    );
    return response.data;
  },

  async toggleMenuActive(id: number): Promise<Menu> {
    const response = await api.patch(`/v1/seller/menus/${id}/toggle-active`);
    return response.data;
  },

  async deleteMenu(id: number): Promise<void> {
    await api.delete(`/v1/seller/menus/${id}`);
  },

  async publishStore(storeId: number): Promise<Store> {
    const response = await api.post(`/v1/seller/stores/${storeId}/publish`);
    return response.data;
  },

  async suspendStore(storeId: number): Promise<Store> {
    const response = await api.post(`/v1/seller/stores/${storeId}/suspend`);
    return response.data;
  },

  async getSubscriptionsForStore(
    storeId: number,
    status?: SubscriptionStatus,
    page = 0,
    size = 10,
  ): Promise<Page<Subscription>> {
    const params: Record<string, string | number> = { page, size };
    if (status) params.status = status;
    const response = await api.get(
      `/v1/seller/subscriptions/stores/${storeId}`,
      { params },
    );
    return response.data;
  },

  async getPendingUnreadCount(storeId: number): Promise<number> {
    const response = await api.get(
      `/v1/seller/subscriptions/stores/${storeId}/unread-count`,
    );
    return response.data.count;
  },

  async markPendingViewed(storeId: number): Promise<void> {
    await api.post(`/v1/seller/subscriptions/stores/${storeId}/mark-viewed`);
  },

  async getDeliveryChangeRequests(
    storeId: number,
  ): Promise<DeliveryChangeRequest[]> {
    return (
      await api.get(
        `/v1/seller/subscriptions/stores/${storeId}/delivery-change-requests`,
      )
    ).data;
  },

  async approveDeliveryChangeRequest(
    requestId: number,
  ): Promise<DeliveryChangeRequest> {
    return (
      await api.post(
        `/v1/seller/subscriptions/delivery-change-requests/${requestId}/approve`,
      )
    ).data;
  },

  async rejectDeliveryChangeRequest(
    requestId: number,
    reason: string,
  ): Promise<DeliveryChangeRequest> {
    return (
      await api.post(
        `/v1/seller/subscriptions/delivery-change-requests/${requestId}/reject`,
        null,
        { params: { reason } },
      )
    ).data;
  },

  async getSellerSubscriptionDetail(
    id: number,
  ): Promise<SellerSubscriptionDetail> {
    const response = await api.get(`/v1/seller/subscriptions/${id}`);
    return response.data;
  },

  async getSubscriptionEvents(id: number): Promise<SubscriptionEvent[]> {
    const response = await api.get(`/v1/seller/subscriptions/${id}/events`);
    return response.data;
  },

  async createMenuForStore(
    storeId: number,
    data: {
      name: string;
      description?: string;
      pricePerPerson: number;
      allergenInfo?: string;
      imageUrl?: string;
      dietTags?: string[];
      allergens?: string[];
      priceEffectiveFrom?: string;
      items?: { id?: number; name: string; description?: string; imageUrl?: string; sortOrder?: number }[];
    },
  ): Promise<Menu> {
    const response = await api.post(`/v1/seller/menus/stores/${storeId}`, data);
    return response.data;
  },

  async setStoreTemporaryClosed(
    storeId: number,
    closed: boolean,
  ): Promise<Store> {
    const response = await api.patch(
      `/v1/seller/stores/${storeId}/temporary-closed`,
      null,
      { params: { closed } },
    );
    return response.data;
  },

  async getServiceAreas(storeId: number): Promise<ServiceArea[]> {
    const response = await api.get(
      `/v1/seller/stores/${storeId}/service-areas`,
    );
    return response.data;
  },

  async deleteServiceArea(storeId: number, areaId: number): Promise<void> {
    await api.delete(`/v1/seller/stores/${storeId}/service-areas/${areaId}`);
  },

  async getClosedDates(storeId: number): Promise<ClosedDate[]> {
    const response = await api.get(`/v1/seller/stores/${storeId}/closed-dates`);
    return response.data;
  },

  async addClosedDate(
    storeId: number,
    data: { closedDate: string; reason?: string },
  ): Promise<ClosedDate> {
    const response = await api.post(
      `/v1/seller/stores/${storeId}/closed-dates`,
      data,
    );
    return response.data;
  },

  async deleteClosedDate(storeId: number, closedDateId: number): Promise<void> {
    await api.delete(
      `/v1/seller/stores/${storeId}/closed-dates/${closedDateId}`,
    );
  },

  async getOrderHistory(
    storeId: number,
    startDate: string,
    endDate: string,
    status?: string,
    page = 0,
    size = 20,
  ): Promise<Page<Delivery>> {
    const params: Record<string, string | number> = {
      startDate,
      endDate,
      page,
      size,
    };
    if (status) params.status = status;
    const response = await api.get(
      `/v1/seller/deliveries/stores/${storeId}/history`,
      { params },
    );
    return response.data;
  },

  async getDeliveryStats(
    storeId: number,
    startDate: string,
    endDate: string,
  ): Promise<{
    delivered: number;
    cancelled: number;
    scheduled: number;
    totalPersons: number;
  }> {
    const response = await api.get(
      `/v1/seller/deliveries/stores/${storeId}/stats`,
      { params: { startDate, endDate } },
    );
    return response.data;
  },

  async getStoreAnalytics(
    storeId: number,
    startDate: string,
    endDate: string,
  ): Promise<StoreAnalytics> {
    const response = await api.get(
      `/v1/seller/deliveries/stores/${storeId}/analytics`,
      { params: { startDate, endDate } },
    );
    return response.data;
  },

  async getNotifications(
    page = 0,
    size = 20,
  ): Promise<
    Page<{
      id: number;
      title: string;
      message: string;
      read: boolean;
      readAt?: string;
      referenceType?: string;
      referenceId?: number;
      createdAt: string;
    }>
  > {
    const response = await api.get("/v1/notifications", {
      params: { page, size },
    });
    return response.data;
  },

  async getUnreadNotificationCount(): Promise<number> {
    const response = await api.get("/v1/notifications/unread-count");
    return response.data.count;
  },

  async markNotificationRead(id: number): Promise<void> {
    await api.patch(`/v1/notifications/${id}/read`);
  },

  async getRevenueStats(
    storeId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalRevenue: number;
    periodRevenue: number;
    activeSubscriptions: number;
    completedSubscriptions: number;
  }> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(
      `/v1/seller/subscriptions/stores/${storeId}/revenue`,
      { params },
    );
    return response.data;
  },

  async getStoreReviews(
    storeId: number,
    page = 0,
    size = 10,
  ): Promise<Page<ReviewItem>> {
    const response = await api.get(`/v1/reviews/store/${storeId}`, {
      params: { page, size },
    });
    return response.data;
  },

  async replyToReview(reviewId: number, reply: string): Promise<ReviewItem> {
    const response = await api.put(`/v1/seller/reviews/${reviewId}/reply`, {
      reply,
    });
    return response.data;
  },

  async getStoreComplaints(
    storeId: number,
    page = 0,
    size = 10,
  ): Promise<Page<ComplaintItem>> {
    const response = await api.get(`/v1/complaints/store/${storeId}`, {
      params: { page, size },
    });
    return response.data;
  },

  async respondComplaint(
    id: number,
    data: {
      response: string;
      status: string;
      escalate?: boolean;
      attachmentUrls?: string;
    },
  ): Promise<ComplaintItem> {
    const response = await api.patch(
      `/v1/complaints/${id}/seller-response`,
      data,
    );
    return response.data;
  },
  async getCouriers(
    storeId: number,
  ): Promise<
    {
      id: number;
      fullName: string;
      phone: string;
      active: boolean;
      workspaceLinked?: boolean;
    }[]
  > {
    const response = await api.get(`/v1/seller/stores/${storeId}/couriers`);
    return response.data;
  },
  async createCourier(
    storeId: number,
    data: { fullName: string; phone?: string; email?: string },
  ): Promise<void> {
    await api.post(`/v1/seller/stores/${storeId}/couriers`, data);
  },
  async assignCourier(
    storeId: number,
    deliveryId: number,
    data: {
      courierId?: number;
      routeSequence?: number;
      deliveryType?: string;
      deliveryDate?: string;
      deliveryTime?: string;
    },
  ): Promise<void> {
    await api.patch(
      `/v1/seller/stores/${storeId}/couriers/deliveries/${deliveryId}`,
      data,
    );
  },

  async getDocuments(storeId: number): Promise<DocumentItem[]> {
    const response = await api.get(`/v1/seller/stores/${storeId}/documents`);
    return response.data;
  },

  async addDocument(
    storeId: number,
    data: { documentType: string; expiryDate?: string; file: File },
  ): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append("documentType", data.documentType);
    if (data.expiryDate) formData.append("expiryDate", data.expiryDate);
    formData.append("file", data.file);
    const response = await api.post(
      `/v1/seller/stores/${storeId}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  async getStoreOnboarding(storeId: number): Promise<StoreOnboarding> {
    const response = await api.get(
      `/v1/seller/stores/${storeId}/documents/onboarding`,
    );
    return response.data;
  },

  async acceptStoreContract(storeId: number): Promise<StoreOnboarding> {
    const response = await api.post(
      `/v1/seller/stores/${storeId}/documents/onboarding/contract`,
    );
    return response.data;
  },

  async deleteDocument(storeId: number, documentId: number): Promise<void> {
    await api.delete(`/v1/seller/stores/${storeId}/documents/${documentId}`);
  },
  async getStoreStaff(storeId: number): Promise<StoreStaff[]> {
    const response = await api.get(`/v1/seller/stores/${storeId}/staff`);
    return response.data;
  },
  async inviteStoreStaff(
    storeId: number,
    email: string,
    role: string,
  ): Promise<StoreStaff> {
    const response = await api.post(`/v1/seller/stores/${storeId}/staff`, {
      email,
      role,
    });
    return response.data;
  },
  async deactivateStoreStaff(storeId: number, staffId: number): Promise<void> {
    await api.delete(`/v1/seller/stores/${storeId}/staff/${staffId}`);
  },
  async getCampaigns(storeId: number): Promise<Campaign[]> {
    return (await api.get(`/v1/seller/stores/${storeId}/campaigns`)).data;
  },
  async createCampaign(
    storeId: number,
    data: Partial<Campaign> & {
      name: string;
      campaignType: string;
      startDate: string;
      endDate: string;
    },
  ): Promise<Campaign> {
    return (await api.post(`/v1/seller/stores/${storeId}/campaigns`, data))
      .data;
  },
  async setCampaignActive(
    storeId: number,
    campaignId: number,
    active: boolean,
  ): Promise<void> {
    await api.patch(
      `/v1/seller/stores/${storeId}/campaigns/${campaignId}/active`,
      null,
      { params: { active } },
    );
  },
};
