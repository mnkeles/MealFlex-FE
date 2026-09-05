import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  LoaderCircle,
  LogOut,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import { systemService } from "@/services/systemService";
import MealFlexLogo from "@/components/brand/MealFlexLogo";
import { confirmSellerStoreNavigation } from "@/utils/sellerStoreNavigation";

export default function SellerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [online, setOnline] = useState(navigator.onLine);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = () => setOnline(true),
      off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["seller-unread-count", user?.userId],
    queryFn: sellerService.getUnreadNotificationCount,
    refetchInterval: 30000,
  });
  const { data: stores = [] } = useQuery({
    queryKey: ["seller-stores-switcher", user?.userId],
    queryFn: sellerService.getMyStores,
  });
  const systemHealth = useQuery({
    queryKey: ["system-health"],
    queryFn: systemService.health,
    enabled: online,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const activeStoreId =
    Number(location.pathname.match(/\/seller\/stores\/(\d+)/)?.[1]) ||
    undefined;
  const menuItems = [
    { path: "/seller/stores", label: "Mağazalar", icon: Store },
    { path: "/seller/notifications", label: "Bildirimler", icon: Bell },
    { path: "/seller/support", label: "Destek Merkezi", icon: CircleHelp },
    {
      path: "/seller/security",
      label: "Hesap ve Güvenlik",
      icon: ShieldCheck,
    },
    { path: "/seller/profile", label: "Profil", icon: UserRound },
  ];
  const activeStoreSection =
    location.pathname.match(/\/seller\/stores\/\d+\/([^/]+)/)?.[1] ||
    "dashboard";
  const mobileItems = [
    { path: "/seller/stores", label: "Mağazalar" },
    { path: "/seller/notifications", label: "Bildirimler" },
    { path: "/seller/support", label: "Destek" },
    { path: "/seller/security", label: "Güvenlik" },
    { path: "/seller/profile", label: "Profil" },
  ];

  const systemStatus = !online
    ? {
        label: "Çevrimdışı",
        className: "text-warning-700",
        chipClassName: "bg-warning-50 text-warning-700",
        icon: WifiOff,
      }
    : systemHealth.isPending
      ? {
          label: "Sistem kontrol ediliyor",
          className: "text-slate-500",
          chipClassName: "bg-slate-50 text-slate-600",
          icon: LoaderCircle,
        }
      : systemHealth.isError || systemHealth.data?.status !== "UP"
        ? {
            label: "Sistem bağlantısı yok",
            className: "text-danger-700",
            chipClassName: "bg-danger-50 text-danger-700",
            icon: Server,
          }
        : {
            label: "Sistem çalışıyor",
            className: "text-success-700",
            chipClassName: "bg-success-50 text-success-700",
            icon: Wifi,
          };
  const SystemStatusIcon = systemStatus.icon;

  const handleLogout = () => {
    setAccountMenuOpen(false);
    logout();
    navigate("/seller/login");
  };

  return (
    <div className="min-h-screen bg-canvas flex">
      {!online && (
        <div className="fixed inset-x-0 top-0 z-[100] bg-warning-600 px-4 py-2 text-center text-sm font-bold text-white">
          Bağlantı kesildi. İşlemler yeniden bağlanınca güncellenir.
        </div>
      )}
      <aside
        className={`hidden min-h-screen fixed z-40 overflow-hidden border-r border-slate-200 bg-white transition-[width] duration-300 ease-in-out md:block ${isSidebarCollapsed ? "w-16" : "w-72"}`}
      >
        <div
          className={`flex h-[89px] items-center border-b border-slate-100 ${isSidebarCollapsed ? "justify-center px-2" : "justify-between px-6"}`}
        >
          <div>
            <Link to="/seller/stores">
              <MealFlexLogo
                showWordmark={!isSidebarCollapsed}
                iconClassName="h-9 w-9"
                wordmarkClassName="text-xl font-black tracking-tight text-primary-600"
              />
            </Link>
            {!isSidebarCollapsed && (
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Satıcı operasyon merkezi
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
            aria-label={
              isSidebarCollapsed ? "Menüyü genişlet" : "Menüyü daralt"
            }
            title={isSidebarCollapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>
        <nav className={`space-y-1 ${isSidebarCollapsed ? "p-2" : "p-4"}`}>
          {menuItems.map(({ icon: Icon, ...item }) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"} ${
                location.pathname.startsWith(item.path)
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                size={19}
                strokeWidth={2}
                className="shrink-0"
                aria-hidden="true"
              />
              <span
                className={`flex min-w-0 flex-1 items-center justify-between ${isSidebarCollapsed ? "hidden" : ""}`}
              >
                <span>{item.label}</span>
                {item.path === "/seller/notifications" && unreadCount > 0 && (
                  <span className="bg-danger-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </nav>
        <div
          className={`absolute bottom-0 left-0 right-0 border-t border-slate-100 ${isSidebarCollapsed ? "p-2 text-center" : "p-4"}`}
          ref={accountMenuRef}
        >
          {!isSidebarCollapsed && (
            <div
              className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${systemStatus.chipClassName}`}
              title="MealFlex servislerinin erişilebilirlik durumu"
            >
              <SystemStatusIcon
                className={`h-3.5 w-3.5 ${systemHealth.isPending ? "animate-spin" : ""}`}
              />
              {systemStatus.label}
            </div>
          )}

          {accountMenuOpen && (
            <div
              role="menu"
              aria-label="Hesap işlemleri"
              className={`absolute bottom-full mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-xl ${isSidebarCollapsed ? "left-2 w-64" : "left-4 right-4"}`}
            >
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-black text-ink">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <Link
                role="menuitem"
                to="/seller/profile"
                onClick={() => setAccountMenuOpen(false)}
                className="mt-1 flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <UserRound className="h-4 w-4" /> Profil
              </Link>
              <Link
                role="menuitem"
                to="/seller/security"
                onClick={() => setAccountMenuOpen(false)}
                className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <ShieldCheck className="h-4 w-4" /> Hesap ve Güvenlik
              </Link>
              <Link
                role="menuitem"
                to="/seller/security#notification-preferences"
                onClick={() => setAccountMenuOpen(false)}
                className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <SlidersHorizontal className="h-4 w-4" /> Bildirim tercihleri
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-danger-600 hover:bg-danger-50"
              >
                <LogOut className="h-4 w-4" /> Çıkış yap
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setAccountMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            title={isSidebarCollapsed ? "Hesap menüsü" : undefined}
            className={`flex w-full items-center rounded-xl text-left transition hover:bg-slate-50 ${isSidebarCollapsed ? "h-11 justify-center" : "gap-3 px-2 py-2"}`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
            {!isSidebarCollapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="block text-xs text-slate-500">Hesap işlemleri</span>
                </span>
                <ChevronUp
                  className={`h-4 w-4 text-slate-400 transition ${accountMenuOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>
        </div>
      </aside>
      <div
        className={`min-w-0 flex-1 overflow-x-hidden transition-[margin] duration-300 ease-in-out ${isSidebarCollapsed ? "md:ml-16" : "md:ml-72"}`}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <Link to="/seller/stores">
            <MealFlexLogo
              iconClassName="h-8 w-8"
              wordmarkClassName="text-lg font-black tracking-tight text-primary-600"
            />
          </Link>
          <span className="text-sm font-bold">{user?.firstName}</span>
        </header>
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur md:flex lg:px-8">
          <label className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-600">
            <Store className="h-4 w-4 shrink-0 text-primary-600" />
            <span className="sr-only">Aktif mağaza</span>
            <select
              aria-label="Aktif mağaza"
              value={activeStoreId || ""}
              onChange={(event) => {
                const id = Number(event.target.value);
                if (id && confirmSellerStoreNavigation())
                  navigate(`/seller/stores/${id}/${activeStoreSection}`);
              }}
              className="h-10 min-w-48 max-w-sm rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            >
              <option value="">Mağaza seçin</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-xs font-bold ${systemStatus.className}`}
              title="MealFlex servislerinin erişilebilirlik durumu"
            >
              <SystemStatusIcon
                className={`h-4 w-4 ${systemHealth.isPending ? "animate-spin" : ""}`}
              />
              {systemStatus.label}
            </span>
            <Link
              to="/seller/notifications"
              aria-label="Bildirimler"
              className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/seller/profile"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-xs text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
              <span>{user?.firstName}</span>
            </Link>
          </div>
        </header>
        <main className="p-4 pb-24 md:p-8">
          <Outlet />
        </main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-6px_20px_rgba(15,23,42,.06)] backdrop-blur md:hidden"
        aria-label="Satıcı mobil navigasyonu"
      >
        {mobileItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`relative flex min-h-11 items-center justify-center px-1 py-2 text-center text-[10px] font-bold ${active ? "text-primary-600" : "text-slate-500"}`}
            >
              {item.label}
              {item.path === "/seller/notifications" && unreadCount > 0 ? (
                <sup className="ml-1 rounded-full bg-primary-600 px-1 text-white">
                  {unreadCount}
                </sup>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
