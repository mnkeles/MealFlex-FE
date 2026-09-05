import { Link, Outlet, useParams, useLocation } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  ChefHat,
  ClipboardCheck,
  Clock3,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  PackageCheck,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Store,
  WalletCards,
} from "lucide-react";
import { sellerService } from "@/services/sellerService";
import Drawer from "@/components/ui/Drawer";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { confirmSellerStoreNavigation } from "@/utils/sellerStoreNavigation";
import ConfirmModal from "@/components/common/ConfirmModal";
import { parseApiError } from "@/utils/apiErrors";

const tabs = [
  { path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "showcase", label: "Vitrin", icon: Store },
  { path: "pending", label: "Onay Bekleyenler", icon: ClipboardCheck },
  { path: "subscriptions", label: "Abonelikler", icon: CalendarDays },
  { path: "daily-orders", label: "Günlük Sipariş", icon: ShoppingCart },
  { path: "operations", label: "Canlı Operasyon", icon: Gauge },
  { path: "production", label: "Üretim", icon: ChefHat },
  { path: "couriers", label: "Kuryeler", icon: PackageCheck },
  { path: "order-history", label: "Geçmiş", icon: Clock3 },
  { path: "payouts", label: "Gelir", icon: WalletCards },
  { path: "analytics", label: "Analitik", icon: BarChart3 },
  { path: "reviews", label: "Yorumlar", icon: MessageSquareText },
  { path: "complaints", label: "Şikâyetler", icon: ShieldAlert },
  { path: "documents", label: "Belgeler", icon: FileText },
  { path: "staff", label: "Personel", icon: BriefcaseBusiness },
  { path: "campaigns", label: "Kampanyalar", icon: BellRing },
  { path: "settings", label: "Ayarlar", icon: Settings },
];

const tabGroups = [
  { label: "Dashboard", paths: ["dashboard"] },
  {
    label: "Operasyon",
    paths: ["pending", "daily-orders", "operations", "production", "couriers"],
  },
  { label: "Abonelikler", paths: ["subscriptions", "order-history"] },
  { label: "Finans", paths: ["payouts", "analytics"] },
  {
    label: "Müşteri ilişkileri",
    paths: ["reviews", "complaints", "campaigns"],
  },
  {
    label: "Mağaza yönetimi",
    paths: ["showcase", "documents", "staff", "settings"],
  },
];

export default function SellerStoreDetailLayout() {
  const { storeId } = useParams<{ storeId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [pendingOrderToggle, setPendingOrderToggle] = useState<boolean | null>(null);
  const [orderToggleError, setOrderToggleError] = useState("");

  const storeQuery = useQuery({
    queryKey: ["seller-store", storeId],
    queryFn: () => sellerService.getStoreById(Number(storeId!)),
    enabled: !!storeId,
  });
  const store = storeQuery.data;

  const temporaryClosedMutation = useMutation({
    mutationFn: (closed: boolean) =>
      sellerService.setStoreTemporaryClosed(Number(storeId!), closed),
    onSuccess: () => {
      setPendingOrderToggle(null);
      setOrderToggleError("");
      queryClient.invalidateQueries({ queryKey: ["seller-store", storeId] });
      queryClient.invalidateQueries({ queryKey: ["seller-stores"] });
      queryClient.invalidateQueries({ queryKey: ["store", Number(storeId)] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
    onError: (error) => {
      setPendingOrderToggle(null);
      setOrderToggleError(
        parseApiError(error, "Sipariş alım durumu güncellenemedi.").message,
      );
    },
  });
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["store-pending-unread", storeId],
    queryFn: () => sellerService.getPendingUnreadCount(Number(storeId!)),
    enabled: !!storeId,
    refetchInterval: 30_000,
  });

  const currentTab =
    tabs.find((t) => location.pathname.includes(`/${t.path}`))?.path ||
    "dashboard";
  const activeGroup =
    tabGroups.find((group) => group.paths.includes(currentTab)) || tabGroups[0];
  const activeGroupTabs = activeGroup.paths
    .map((path) => tabs.find((tab) => tab.path === path))
    .filter(Boolean) as typeof tabs;
  const storeStatus = store?.status || "DRAFT";

  if (storeQuery.isLoading) {
    return (
      <div className="mf-surface p-10 text-center text-sm text-slate-500" role="status">
        Mağaza bilgileri yükleniyor...
      </div>
    );
  }

  if (storeQuery.isError || !store) {
    return (
      <EmptyState
        title="Mağaza bilgileri yüklenemedi"
        description="Bağlantıyı kontrol edip tekrar deneyin veya mağaza listenize dönün."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => storeQuery.refetch()}>
              Tekrar dene
            </Button>
            <Link to="/seller/stores">
              <Button>Mağazalarıma dön</Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <Link
          to="/seller/stores"
          onClick={(event) => {
            if (!confirmSellerStoreNavigation()) event.preventDefault();
          }}
          className="mb-3 inline-block text-sm font-bold text-slate-500 transition hover:text-primary-700"
        >
          &larr; Mağazalarıma dön
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-50 text-primary-600">
              <Store size={21} />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-ink">
                {store?.name || "Mağaza"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge domain="store" status={storeStatus} />
                {store.temporarilyClosed && (
                  <StatusBadge tone="danger">Yeni siparişler duraklatıldı</StatusBadge>
                )}
                {pendingCount > 0 && (
                  <span className="rounded-full bg-warning-50 px-2.5 py-1 text-[11px] font-black text-warning-700">
                    {pendingCount} yeni talep
                  </span>
                )}
              </div>
            </div>
          </div>
          {storeStatus === "ACTIVE" && (
            <div className="group relative">
              <button
                onClick={() => setPendingOrderToggle(!store.temporarilyClosed)}
                disabled={temporaryClosedMutation.isPending}
                aria-describedby="store-order-toggle-help"
                className={`${store?.temporarilyClosed ? "bg-success-600 text-white hover:bg-success-700" : "bg-danger-50 text-danger-700 hover:bg-danger-100"} h-11 rounded-xl px-4 text-sm font-bold disabled:opacity-50`}
              >
                {store?.temporarilyClosed
                  ? "Yeni Siparişleri Aç"
                  : "Yeni Siparişleri Durdur"}
              </button>
              <span
                id="store-order-toggle-help"
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-72 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium leading-5 text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {store?.temporarilyClosed
                  ? "Mağazayı yeniden siparişe açar."
                  : "Yeni siparişleri geçici olarak durdurur; mevcut abonelikler ve kayıtlar korunur."}
              </span>
            </div>
          )}
        </div>
        {orderToggleError && (
          <p role="alert" className="mt-4 text-sm font-semibold text-danger-600">
            {orderToggleError}
          </p>
        )}
      </section>

      <nav
        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card"
        aria-label="Mağaza bölümleri"
      >
        <button
          type="button"
          onClick={() => setMobileNavigationOpen(true)}
          className="flex min-h-11 w-full items-center justify-between rounded-xl bg-slate-50 px-3 text-left text-sm font-bold text-slate-700 md:hidden"
        >
          <span>
            {activeGroup.label} ·{" "}
            {tabs.find((tab) => tab.path === currentTab)?.label}
          </span>
          <Menu className="h-5 w-5 text-primary-600" />
        </button>
        <div className="hidden flex-wrap gap-2 border-b border-slate-100 pb-3 md:flex">
          {tabGroups.map((group) => (
            <Link
              key={group.label}
              to={`/seller/stores/${storeId}/${group.paths[0]}`}
              onClick={(event) => {
                if (!confirmSellerStoreNavigation()) event.preventDefault();
              }}
              className={`rounded-xl px-3 py-2 text-xs font-black transition ${group.label === activeGroup.label ? "bg-primary-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-primary-50 hover:text-primary-700"}`}
            >
              {group.label}
            </Link>
          ))}
        </div>
        <div className="mt-3 hidden flex-wrap gap-2 md:flex">
          {activeGroupTabs.map(({ icon: Icon, ...tab }) => (
            <Link
              key={tab.path}
              to={`/seller/stores/${storeId}/${tab.path}`}
              onClick={(event) => {
                if (!confirmSellerStoreNavigation()) event.preventDefault();
              }}
              className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                currentTab === tab.path
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
      <Drawer
        open={mobileNavigationOpen}
        title="Mağaza bölümleri"
        onClose={() => setMobileNavigationOpen(false)}
      >
        {tabGroups.map((group) => (
          <section key={group.label} className="mb-6">
            <h2 className="text-xs font-black uppercase tracking-[.14em] text-slate-500">
              {group.label}
            </h2>
            <div className="mt-2 grid gap-1">
              {group.paths.map((path) => {
                const tab = tabs.find((item) => item.path === path)!;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.path}
                    to={`/seller/stores/${storeId}/${tab.path}`}
                    onClick={(event) => {
                      if (!confirmSellerStoreNavigation()) {
                        event.preventDefault();
                        return;
                      }
                      setMobileNavigationOpen(false);
                    }}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${currentTab === tab.path ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </Drawer>

      <Outlet context={{ storeId: Number(storeId), store }} />
      <ConfirmModal
        open={pendingOrderToggle !== null}
        title={
          pendingOrderToggle
            ? `${store.name} için yeni siparişler durdurulsun mu?`
            : `${store.name} için yeni siparişler açılsın mı?`
        }
        message={
          pendingOrderToggle
            ? "Yeni abonelik ve sipariş talepleri duraklatılır. Mevcut abonelikler ve planlı teslimatlar korunur."
            : "Mağaza yeniden yeni abonelik ve sipariş taleplerine açık olur."
        }
        confirmLabel={pendingOrderToggle ? "Siparişleri durdur" : "Siparişleri aç"}
        danger={pendingOrderToggle === true}
        pending={temporaryClosedMutation.isPending}
        onClose={() => {
          if (!temporaryClosedMutation.isPending) setPendingOrderToggle(null);
        }}
        onConfirm={() => {
          if (pendingOrderToggle !== null)
            temporaryClosedMutation.mutate(pendingOrderToggle);
        }}
      />
    </div>
  );
}
