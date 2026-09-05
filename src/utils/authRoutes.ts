import type { Role } from "@/types";

export type LoginAudience = "CUSTOMER" | "SELLER" | "ADMIN";

export const loginPathForAudience = (audience: LoginAudience) => {
  if (audience === "ADMIN") return "/admin/login";
  if (audience === "SELLER") return "/seller/login";
  return "/login";
};

export const loginPathForPathname = (pathname: string) => {
  if (pathname.startsWith("/admin")) return "/admin/login";
  if (pathname.startsWith("/seller")) return "/seller/login";
  return "/login";
};

export const defaultPathForRole = (role?: Role) => {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "SELLER") return "/seller/dashboard";
  return "/";
};

export const roleLabel = (role: Role) =>
  ({ CUSTOMER: "müşteri", SELLER: "satıcı", ADMIN: "yönetici" })[role];
