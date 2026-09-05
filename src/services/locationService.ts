import api from "./api";

export interface LocationOption {
  id: number;
  name: string;
}

export const locationService = {
  async getProvinces(): Promise<LocationOption[]> {
    return (await api.get("/v1/locations/provinces")).data;
  },
  async getDistricts(provinceId: number): Promise<LocationOption[]> {
    return (
      await api.get("/v1/locations/districts", { params: { provinceId } })
    ).data;
  },
  async getNeighborhoods(districtId: number): Promise<LocationOption[]> {
    return (
      await api.get("/v1/locations/neighborhoods", { params: { districtId } })
    ).data;
  },
};
