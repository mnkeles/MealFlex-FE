import api from "./api";
import type {
  Store,
  Menu,
  BusinessHour,
  Page,
  Review,
} from "@/types";

export interface StoreFilters {
  search?: string;
  sort?: "recommended" | "distance" | "rating" | "price" | "minimum";
  minRating?: number;
  maxMinPersonCount?: number;
  openOnly?: boolean;
  category?: string;
  dietTag?: string;
  excludedAllergen?: string;
  page?: number;
  size?: number;
}

export const storeService = {
  async getDiscoveryMetadata(): Promise<{
    categories: string[];
    dietTags: string[];
    allergens: string[];
  }> {
    const response = await api.get("/v1/stores/discovery-metadata");
    return response.data;
  },

  async getRecentStores(addressId: number): Promise<Store[]> {
    const response = await api.get("/v1/stores/recent", {
      params: { addressId },
    });
    return response.data;
  },

  async recordStoreView(storeId: number): Promise<void> {
    await api.post(`/v1/stores/${storeId}/view`);
  },
  async getStores(
    addressId: number,
    filters: StoreFilters = {},
  ): Promise<Page<Store>> {
    const response = await api.get("/v1/stores", {
      params: { addressId, page: 0, size: 12, sort: "recommended", ...filters },
    });
    return response.data;
  },

  async getStore(id: number, addressId?: number): Promise<Store> {
    const response = await api.get(`/v1/stores/${id}`, {
      params: addressId ? { addressId } : undefined,
    });
    return response.data;
  },

  async getBusinessHours(storeId: number): Promise<BusinessHour[]> {
    const response = await api.get(`/v1/stores/${storeId}/business-hours`);
    return response.data;
  },

  async getMenus(storeId: number): Promise<Menu[]> {
    const response = await api.get(`/v1/stores/${storeId}/menus`);
    return response.data;
  },

  async getDeliveryTimes(storeId: number, startDate: string, endDate: string): Promise<string[]> {
    const response = await api.get(`/v1/stores/${storeId}/delivery-times`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  async getMenu(storeId: number, menuId: number): Promise<Menu> {
    const response = await api.get(`/v1/stores/${storeId}/menus/${menuId}`);
    return response.data;
  },

  async getReviews(storeId: number, page = 0, size = 6): Promise<Page<Review>> {
    const response = await api.get(`/v1/reviews/store/${storeId}`, {
      params: { page, size },
    });
    return response.data;
  },

  async isFavorite(storeId: number): Promise<boolean> {
    const response = await api.get(`/v1/favorites/check/${storeId}`);
    return response.data.isFavorite;
  },

  async addFavorite(storeId: number): Promise<void> {
    await api.post(`/v1/favorites/${storeId}`);
  },

  async removeFavorite(storeId: number): Promise<void> {
    await api.delete(`/v1/favorites/${storeId}`);
  },
};
