import api from "./api";
import type { Address } from "@/types";

export const addressService = {
  async getMyAddresses(): Promise<Address[]> {
    const response = await api.get("/v1/addresses");
    return response.data;
  },

  async createAddress(data: Omit<Address, "id">): Promise<Address> {
    const response = await api.post("/v1/addresses", data);
    return response.data;
  },

  async updateAddress(id: number, data: Omit<Address, "id">): Promise<Address> {
    const response = await api.put(`/v1/addresses/${id}`, data);
    return response.data;
  },

  async deleteAddress(id: number): Promise<void> {
    await api.delete(`/v1/addresses/${id}`);
  },

  async setDefaultAddress(id: number): Promise<Address> {
    const response = await api.post(`/v1/addresses/${id}/default`);
    return response.data;
  },
};
