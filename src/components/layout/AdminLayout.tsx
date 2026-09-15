import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeDollarSign,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Gauge,
  LayoutDashboard,
  Menu,
  Search,
  LifeBuoy,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MealFlexLogo from "@/components/brand/MealFlexLogo";
import { adminService } from "@/services/adminService";

const menuGroups = [
  {
    label: "Genel Bakış",
    items: [
      {
        path: "/admin/dashboard",
        label: "Operasyon merkezi",
        icon: LayoutDashboard,
      },
      { path: "/admin/notifications", label: "Bildirimler", icon: Bell },
    ],
  },
  {
    label: "Kullanıcılar ve Mağazalar",
    items: [
      { path: "/admin/users", label: "Kullanıcılar", icon: Users },
      { path: "/admin/stores", label: "Mağazalar", icon: Store },
      {
        path: "/admin/seller-onboarding",
        label: "Satıcı başvuruları",
        icon: Building2,
      },
    ],
  },
  {
    label: "Operasyon",
    items: [
      { path: "/admin/subscriptions", label: "Abonelikler", icon: Gauge },
    ],
  },
  {
    label: "Finans",
    items: [
      { path: "/admin/finance", label: "Ödemeler", icon: BadgeDollarSign },
      { path: "/admin/reconciliation", label: "Mutabakat", icon: ShieldCheck },
    ],
  },
  {
    label: "Destek",
    items: [
      { path: "/admin/support-requests", label: "Destek talepleri", icon: LifeBuoy },
      { path: "/admin/complaints", label: "Şikâyetler", icon: AlertTriangle },
    ],
  },
  {
    label: "Güvenlik",
    items: [
      {
        path: "/admin/audit-search",
        label: "Arama ve audit",
        icon: FileSearch,
      },
      { path: "/admin/risk", label: "Risk yönetimi", icon: ShieldAlert },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const taskQuery = useQuery({
    queryKey: ["admin-layout-task-count"],
    queryFn: () => adminService.getOperationsSummary(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const taskCount = taskQuery.data?.taskCount ?? 0;
  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const nav = () => (
    <nav className={`space-y-6 p-4 ${collapsed ? "px-2" : ""}`}>
      {menuGroups.map((group) => (
        <div key={group.label}>
          <p
            className={`mb-2 px-3 text-[10px] font-black uppercase tracking-[.14em] text-slate-500 ${collapsed ? "hidden" : ""}`}
          >
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map(({ icon: Icon, ...item }) => {
              const active =
                location.pathname === item.path ||
                (item.path !== "/admin/dashboard" &&
                  location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${collapsed ? "justify-center" : ""} ${active ? "bg-primary-50 text-primary-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className={collapsed ? "hidden" : ""}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas md:flex">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
        <Link to="/admin/dashboard">
          <MealFlexLogo
            iconClassName="h-9 w-9"
            wordmarkClassName="text-xl font-black tracking-tight text-primary-600"
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/dashboard#operation-tasks"
            aria-label={`${taskCount} açık operasyon görevi`}
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-warning-700"
          >
            <Bell className="h-5 w-5" />
            {taskCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger-600 px-1 text-center text-[10px] font-black leading-5 text-white">
                {taskCount > 99 ? "99+" : taskCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Admin menüsünü aç"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/35 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="flex h-full w-[min(20rem,88vw)] flex-col bg-white shadow-floating"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b px-4">
              <MealFlexLogo
                iconClassName="h-9 w-9"
                wordmarkClassName="text-xl font-black tracking-tight text-primary-600"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Menüyü kapat"
                className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{nav()}</div>
            <div className="border-t border-slate-100 p-4">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-primary-600">Platform yöneticisi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-500 hover:bg-danger-50 hover:text-danger-700"
              >
                Çıkış yap
              </button>
            </div>
          </aside>
        </div>
      )}
      <aside
        className={`fixed hidden h-screen flex-col border-r border-slate-200 bg-white transition-[width] duration-200 md:flex ${collapsed ? "w-20" : "w-72"}`}
      >
        <div
          className={`flex items-center border-b border-slate-100 py-5 ${collapsed ? "justify-center px-2" : "justify-between px-6"}`}
        >
          <div>
            <Link to="/admin/dashboard">
              <MealFlexLogo
                showWordmark={!collapsed}
                iconClassName="h-10 w-10"
                wordmarkClassName="text-xl font-black tracking-tight text-primary-600"
              />
            </Link>
            <p
              className={`mt-2 text-xs font-semibold text-slate-500 ${collapsed ? "hidden" : ""}`}
            >
              Platform Yönetim Merkezi
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            className={`grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 ${collapsed ? "absolute -right-4 top-5 border bg-white shadow-card" : ""}`}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{nav()}</div>
        <div className="border-t border-slate-100 p-4">
          <div
            className={`flex items-center gap-3 rounded-xl bg-slate-50 p-3 ${collapsed ? "justify-center" : ""}`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
            <div className={`min-w-0 flex-1 ${collapsed ? "hidden" : ""}`}>
              <p className="truncate text-sm font-black text-slate-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-primary-600">Platform yöneticisi</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title={collapsed ? "Çıkış yap" : undefined}
            className={`mt-3 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-danger-50 hover:text-danger-700 ${collapsed ? "text-center" : "text-left"}`}
          >
            Çıkış yap
          </button>
        </div>
      </aside>
      <div
        className={`min-w-0 flex-1 transition-[margin] duration-200 ${collapsed ? "md:ml-20" : "md:ml-72"}`}
      >
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur md:flex">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4 text-success-600" />
            Güvenli yönetim oturumu
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/audit-search"
              className="flex h-10 w-72 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition hover:border-primary-200 hover:bg-white"
            >
              <Search className="h-4 w-4" />
              Kullanıcı, mağaza veya işlem ara
            </Link>
            <Link
              to="/admin/dashboard#operation-tasks"
              aria-label={`${taskCount} açık operasyon görevi`}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-warning-700 hover:bg-warning-50"
            >
              <Bell className="h-5 w-5" />
              {taskCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger-600 px-1 text-center text-[10px] font-black leading-5 text-white">
                  {taskCount > 99 ? "99+" : taskCount}
                </span>
              )}
            </Link>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
          </div>
        </header>
        <main className="p-4 pb-10 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
