import api from "./api";

export interface SystemHealth {
  status: string;
}

export const systemService = {
  health: async (): Promise<SystemHealth> =>
    (
      await api.get<SystemHealth>("/actuator/health", {
        timeout: 5_000,
      })
    ).data,
};
