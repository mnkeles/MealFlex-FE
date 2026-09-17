import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronDown,
  Heart,
  Home,
  LifeBuoy,
  LogOut,
  MapPin,
  MapPinned,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomerAddress } from "@/contexts/CustomerAddressContext";
import api from "@/services/api";
import MealFlexLogo from "@/components/brand/MealFlexLogo";

const desktopLinks = [
  { to: "/", label: "Keşfet" },
  { to: "/subscriptions", label: "Aboneliklerim" },
  { to: "/favorites", label: "Favoriler" },
];
const mobileLinks = [
  { to: "/", label: "Keşfet", icon: Home },
  { to: "/subscriptions", label: "Abonelikler", icon: UtensilsCrossed },
  { to: "/favorites", label: "Favoriler", icon: Heart },
  { to: "/notifications", label: "Bildirimler", icon: Bell },
  { to: "/profile", label: "Hesabım", icon: UserRound },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative px-3 py-2 text-sm font-semibold transition ${isActive ? "text-ink after:absolute after:inset-x-3 after:-bottom-2 after:h-0.5 after:bg-primary-600" : "text-slate-600 hover:text-ink"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { addresses, activeAddressId, setActiveAddressId } =
    useCustomerAddress();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { data: unread } = useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: async () =>
      (await api.get("/v1/notifications/unread-count")).data as {
        count: number;
      },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <>
      {!online && (
        <div className="fixed inset-x-0 top-0 z-[100] bg-warning-600 px-4 py-2 text-center text-sm font-bold text-white">
          İnternet bağlantısı kesildi. İşlemler yeniden bağlanınca güncellenir.
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-[#e9e4da] bg-[#fffefa]/95 backdrop-blur">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0" aria-label="MealFlex ana sayfa">
            <MealFlexLogo
              iconClassName="h-8 w-8"
              wordmarkClassName="hidden text-xl font-bold tracking-tight sm:inline"
            />
          </Link>
          <div className="relative min-w-0 flex-1 sm:max-w-[18rem]">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-600" />
            {addresses.length ? (
              <>
                <select
                  aria-label="Aktif teslimat adresi"
                  value={activeAddressId || ""}
                  onChange={(event) =>
                    setActiveAddressId(Number(event.target.value))
                  }
                  className="h-10 w-full appearance-none truncate rounded-lg border border-[#e6e1d8] bg-white pl-9 pr-9 text-sm font-medium text-ink outline-none transition hover:border-primary-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                >
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.title} · {address.district}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </>
            ) : (
              <Link
                to="/addresses"
                className="flex h-10 items-center rounded-lg border border-primary-200 bg-primary-50 pl-9 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
              >
                Teslimat adresi ekle
              </Link>
            )}
          </div>
          <nav
            className="ml-auto hidden items-center gap-1 md:flex"
            aria-label="Ana navigasyon"
          >
            {desktopLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={navClass}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/notifications"
              aria-label="Bildirimler"
              className={({ isActive }) =>
                `relative rounded-lg p-2 transition ${isActive ? "text-primary-700" : "text-slate-600 hover:text-ink"}`
              }
            >
              <Bell className="h-5 w-5" />
              {!!unread?.count && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                  {unread.count}
                </span>
              )}
            </NavLink>
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-ink hover:bg-[#f4efe7]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#294438] text-xs text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
                <span className="hidden lg:inline">Hesabım</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {profileOpen && (
                <div
                  role="menu"
                  aria-label="Hesap işlemleri"
                  className="absolute right-0 mt-2 w-64 rounded-xl border border-[#e6e1d8] bg-white p-2 shadow-floating"
                >
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user?.email}
                    </p>
                  </div>
                  {[
                    { to: "/profile", label: "Profil", icon: UserRound },
                    { to: "/addresses", label: "Adresler", icon: MapPinned },
                    {
                      to: "/payment-methods",
                      label: "Ödeme yöntemleri",
                      icon: WalletCards,
                    },
                    {
                      to: "/payments",
                      label: "Ödeme geçmişi",
                      icon: ReceiptText,
                    },
                    {
                      to: "/support",
                      label: "Destek Merkezi",
                      icon: LifeBuoy,
                    },
                    {
                      to: "/security",
                      label: "Hesap ve Güvenlik",
                      icon: ShieldCheck,
                    },
                    {
                      to: "/security#notification-preferences",
                      label: "Bildirim tercihleri",
                      icon: SlidersHorizontal,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        role="menuitem"
                        key={item.to}
                        to={item.to}
                        onClick={() => setProfileOpen(false)}
                        className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Icon className="h-4 w-4 text-slate-500" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-danger-700 hover:bg-danger-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Çıkış yap
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#e6e1d8] bg-[#fffefa]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
        aria-label="Mobil navigasyon"
      >
        {mobileLinks.map((item) => {
          const Icon = item.icon;
          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] font-semibold ${active ? "text-primary-700" : "text-slate-500"}`}
            >
              <Icon className="h-5 w-5" />
              {item.to === "/notifications" && !!unread?.count && (
                <span className="absolute left-1/2 top-0 ml-2 grid h-5 min-w-5 place-items-center rounded-full bg-primary-600 px-1 text-[9px] font-semibold text-white">
                  {unread.count > 99 ? "99+" : unread.count}
                </span>
              )}{" "}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
