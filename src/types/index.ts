export type Role = "CUSTOMER" | "SELLER" | "ADMIN";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface ApiError {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
  timestamp: string;
}

export interface Address {
  id: number;
  title: string;
  city: string;
  district: string;
  neighborhood?: string;
  street?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  fullAddress?: string;
  directions?: string;
  latitude: number;
  longitude: number;
  defaultAddress?: boolean;
  nearbyAddressWarning?: boolean;
}

export interface Store {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  minPersonCount: number;
  effectiveMinPersonCount?: number;
  maxPersonCount?: number;
  dailyCapacity?: number;
  changeCutoffHours?: number;
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
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  maxDeliveryDistanceKm?: number;
  startingPrice?: number;
  status: string;
  rating: number;
  reviewCount: number;
  temporarilyClosed: boolean;
  categories: string[];
  nextAvailableDeliveryDate?: string;
  availableDeliveryTimes: string[];
}

export interface Menu {
  id: number;
  storeId: number;
  name: string;
  description?: string;
  pricePerPerson: number;
  priceEffectiveFrom?: string;
  imageUrl?: string;
  galleryImages?: MenuGalleryImage[];
  allergenInfo?: string;
  dietTags: string[];
  allergens: string[];
  active: boolean;
  items: MenuItem[];
}

export interface MenuGalleryImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
}

export interface BusinessHour {
  id: number;
  dayOfWeek: string;
  open: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface DeliverySlot {
  id: number;
  deliveryTime: string;
}

export type SubscriptionStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ACTIVE"
  | "PAYMENT_SUSPENDED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED";

export interface Subscription {
  id: number;
  storeId: number;
  storeName: string;
  storeLogoUrl?: string;
  menuId: number;
  menuName: string;
  addressId: number;
  addressTitle?: string;
  deliveryAddress?: string;
  personCount: number;
  pricePerPerson: number;
  deliveryTime: string;
  startDate: string;
  endDate: string;
  serviceDayCount: number;
  totalAmount: number;
  status: SubscriptionStatus;
  nextDeliveryDate?: string;
  cancellationReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  createdAt: string;
  approvalDeadlineAt?: string;
  sellerViewedAt?: string;
  autoRenew: boolean;
  renewalPeriodDays: number;
  lastAutoRenewedAt?: string;
  customerName?: string;
  customerPhone?: string;
  distanceKm?: number;
}

export interface SubscriptionEvent {
  id: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface SubscriptionPreview {
  storeId: number;
  menuId: number;
  distanceKm: number;
  minimumPersonCount: number;
  serviceDayCount: number;
  serviceDates: string[];
  excludedDates: string[];
  pricePerPerson: number;
  priceEffectiveFrom?: string;
  totalAmount: number;
}

export interface CustomerSubscriptionDetail {
  subscription: Subscription;
  addressTitle?: string;
  deliveryAddress?: string;
  deliveries: Delivery[];
  reviewed: boolean;
}

export interface Review {
  id: number;
  customerName: string;
  customerPhoneMasked?: string;
  rating: number;
  comment?: string;
  sellerReply?: string;
  sellerRepliedAt?: string;
  createdAt: string;
}

export interface CustomerComplaint {
  id: number;
  subscriptionId: number;
  deliveryId?: number;
  storeName: string;
  reason: string;
  description: string;
  status: import("@/constants/complaintStatus").ComplaintStatus;
  response?: string;
  sellerResponse?: string;
  resolutionType?:
    | "NO_COMPENSATION"
    | "FULL_REFUND"
    | "PARTIAL_REFUND"
    | "COUPON"
    | "MAKEUP_DELIVERY";
  resolutionAmount?: number;
  compensationCode?: string;
  resolvedAt?: string;
  updatedAt?: string;
  createdAt: string;
}

export type DeliveryStatus =
  | "SCHEDULED"
  | "PREPARING"
  | "IN_TRANSIT"
  | "DELIVERY_ATTEMPTED"
  | "FAILED"
  | "DELIVERED"
  | "SKIPPED"
  | "CANCELLED";

export interface Delivery {
  id: number;
  subscriptionId: number;
  customerPhoneMasked?: string;
  deliveryDate: string;
  deliveryTime: string;
  personCount: number;
  menuId?: number;
  addressId?: number;
  menuName: string;
  customerName: string;
  deliveryAddress: string;
  deliveryAddressDetails?: string;
  courierId?: number;
  courierName?: string;
  routeSequence?: number;
  status: DeliveryStatus;
  notes?: string;
  customerNote?: string;
  deliveredAt?: string;
  statusChangedAt?: string;
  preparationStartedAt?: string;
  inTransitAt?: string;
  estimatedDeliveryAt?: string;
  deliveryAttemptedAt?: string;
  failureReason?: string;
  receiverName?: string;
  proofPhotoUrl?: string;
  deliveryCode?: string;
  delayMinutes?: number;
  courierLatitude?: number;
  courierLongitude?: number;
  compensationStatus?: "OFFERED" | "RESCHEDULED";
  suggestedCompensationDate?: string;
  makeupSourceDeliveryId?: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
