import api from "./api";
import type { AuthResponse } from "@/types";

export const authService = {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role: "CUSTOMER" | "SELLER";
  }): Promise<AuthResponse> {
    const response = await api.post("/v1/auth/register", data);
    return response.data;
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await api.post("/v1/auth/login", data);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post("/v1/auth/refresh", { refreshToken });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/v1/auth/logout", { refreshToken });
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await api.post("/v1/auth/change-password", data);
  },
};
