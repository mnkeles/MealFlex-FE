import api from "./api";
import type { Delivery, DeliveryStatus } from "@/types";
import type { DeliveryStatusUpdate } from "./sellerService";

export const courierService = {
  today: async (): Promise<Delivery[]> =>
    (await api.get("/v1/courier/deliveries/today")).data,
  update: async (
    deliveryId: number,
    data: DeliveryStatusUpdate & { status: DeliveryStatus },
  ): Promise<Delivery> =>
    (await api.patch(`/v1/courier/deliveries/${deliveryId}/status`, data)).data,
};
