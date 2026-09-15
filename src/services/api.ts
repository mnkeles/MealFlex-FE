import axios, { type InternalAxiosRequestConfig } from "axios";
import { loginPathForPathname } from "@/utils/authRoutes";

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

const refreshAccessToken = (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return Promise.reject(new Error("Refresh token bulunamadı."));

  refreshPromise = axios
    .post("/api/v1/auth/refresh", { refreshToken })
    .then(({ data }) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken as string;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.headers["X-Correlation-Id"] = crypto.randomUUID();
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    const isAuthenticationRequest = originalRequest?.url?.includes("/v1/auth/");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !isAuthenticationRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/v1/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        const loginPath = loginPathForPathname(window.location.pathname);
        if (window.location.pathname !== loginPath) window.location.href = loginPath;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
