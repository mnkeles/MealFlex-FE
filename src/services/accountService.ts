import api from "./api";
export interface AccountSession {
  id: number;
  deviceName: string;
  ipAddress: string;
  lastSeenAt: string;
  createdAt: string;
}
export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  marketingEnabled: boolean;
}
export interface Consent {
  id: number;
  documentType: string;
  documentVersion: string;
  acceptedAt: string;
}
export interface DataRequest {
  id: number;
  requestType: string;
  status: string;
  requestedAt: string;
}
type CodeResponse = { message: string; developmentCode?: string };
export const accountService = {
  forgotPassword: async (email: string): Promise<CodeResponse> =>
    (await api.post("/v1/auth/forgot-password", { email })).data,
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post("/v1/auth/reset-password", { token, newPassword });
  },
  requestEmail: async (): Promise<CodeResponse> =>
    (await api.post("/v1/account/email/request")).data,
  verifyEmail: async (code: string): Promise<void> => {
    await api.post("/v1/account/email/verify", { code });
  },
  requestPhone: async (): Promise<CodeResponse> =>
    (await api.post("/v1/account/phone/request")).data,
  verifyPhone: async (code: string): Promise<void> => {
    await api.post("/v1/account/phone/verify", { code });
  },
  sessions: async (): Promise<AccountSession[]> =>
    (await api.get("/v1/account/sessions")).data,
  revokeSession: async (id: number): Promise<void> => {
    await api.delete(`/v1/account/sessions/${id}`);
  },
  revokeAllSessions: async (): Promise<void> => {
    await api.delete("/v1/account/sessions");
  },
  preferences: async (): Promise<NotificationPreferences> =>
    (await api.get("/v1/account/notification-preferences")).data,
  updatePreferences: async (
    values: NotificationPreferences,
  ): Promise<NotificationPreferences> =>
    (await api.put("/v1/account/notification-preferences", values)).data,
  consents: async (): Promise<Consent[]> =>
    (await api.get("/v1/account/consents")).data,
  requestExport: async (): Promise<DataRequest> =>
    (await api.post("/v1/account/data-requests/export")).data,
  dataRequests: async (): Promise<DataRequest[]> =>
    (await api.get("/v1/account/data-requests")).data,
  exportData: async (): Promise<Record<string, unknown>> =>
    (await api.get("/v1/account/data-export")).data,
  reauthenticate: async (password: string): Promise<string> =>
    (await api.post("/v1/account/reauthenticate", { password })).data
      .reauthToken,
  deleteAccount: async (
    confirmation: string,
    reauthToken: string,
  ): Promise<void> => {
    await api.delete("/v1/account", {
      data: { confirmation },
      headers: { "X-Reauth-Token": reauthToken },
    });
  },
};
