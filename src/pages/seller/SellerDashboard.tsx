import { useQuery } from "@tanstack/react-query";
import { Link, useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  BellRing,
  CalendarCheck2,
  ChefHat,
  ClipboardCheck,
  CookingPot,
  PackageCheck,
  Settings,
} from "lucide-react";
import { sellerService } from "@/services/sellerService";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import type { Store as StoreType } from "@/types";

export default function SellerDashboard() {
  const { storeId, store } = useOutletContext<{
    storeId: number;
    store?: StoreType;
  }>();
  const deliveriesQuery = useQuery({
    queryKey: ["seller-deliveries-today", storeId],
    queryFn: () => sellerService.getTodaysDeliveries(storeId),
    enabled: !!storeId,
  });
  const pendingSubsQuery = useQuery({
    queryKey: ["seller-subs-pending", storeId],
    queryFn: () =>
      sellerService.getSubscriptionsForStore(
        storeId,
        "PENDING_APPROVAL",
        0,
        1,
      ),
    enabled: !!storeId,
  });
  const activeSubsQuery = useQuery({
    queryKey: ["seller-subs-active", storeId],
    queryFn: () =>
      sellerService.getSubscriptionsForStore(storeId, "ACTIVE", 0, 1),
    enabled: !!storeId,
  });
  const deliveries = deliveriesQuery.data ?? [];
  const pendingSubs = pendingSubsQuery.data;
  const activeSubs = activeSubsQuery.data;
  const hasDataError =
    deliveriesQuery.isError ||
    pendingSubsQuery.isError ||
    activeSubsQuery.isError;
  const retryData = () => {
    void deliveriesQuery.refetch();
    void pendingSubsQuery.refetch();
    void activeSubsQuery.refetch();
  };
  const totalPortions = deliveries.reduce(
    (sum, delivery) => sum + delivery.personCount,
    0,
  );
  const criticalDeliveries = deliveries
    .filter(
      (delivery) =>
        delivery.delayMinutes ||
        ["FAILED", "DELIVERY_ATTEMPTED"].includes(delivery.status),
    )
    .sort(
      (left, right) => (right.delayMinutes || 0) - (left.delayMinutes || 0),
    );

  return (
    <div className="mf-page">
      <PageHeader
        eyebrow={store?.name ? `${store.name} · Günlük operasyon` : "Günlük operasyon"}
        title="Bugünün kontrol merkezi"
        description="Teslimatları, abonelik taleplerini ve üretim ihtiyacını tek bakışta yönetin."
        actions={
          <Link to={`/seller/stores/${storeId}/settings`}>
            <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
              Mağaza ayarları
            </Button>
          </Link>
        }
      />
      {hasDataError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm font-semibold text-warning-800"
        >
          <span>Bazı operasyon verileri yüklenemedi. Gösterilemeyen değerler “—” olarak işaretlendi.</span>
          <Button variant="outline" size="sm" onClick={retryData}>
            Tekrar dene
          </Button>
        </div>
      )}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bugünkü teslimatlar"
          value={deliveriesQuery.isError ? "—" : deliveries.length}
          icon={<PackageCheck className="h-5 w-5" />}
          detail="Teslimat planındaki kayıtlar"
          tone="primary"
        />
        <StatCard
          label="Aktif abonelik"
          value={activeSubsQuery.isError ? "—" : (activeSubs?.totalElements ?? 0)}
          icon={<CalendarCheck2 className="h-5 w-5" />}
          detail="Devam eden müşteri abonelikleri"
          tone="success"
        />
        <StatCard
          label="Onay bekleyen"
          value={pendingSubsQuery.isError ? "—" : (pendingSubs?.totalElements ?? 0)}
          icon={<ClipboardCheck className="h-5 w-5" />}
          detail="Hızlı karar gerektiren talepler"
          tone="warning"
        />
        <StatCard
          label="Hazırlanacak porsiyon"
          value={deliveriesQuery.isError ? "—" : totalPortions}
          icon={<ChefHat className="h-5 w-5" />}
          detail="Bugünün toplam üretim ihtiyacı"
          tone="danger"
        />
      </section>

      <section className="space-y-3" aria-label="Kritik operasyon uyarıları">
        {!deliveriesQuery.isError && criticalDeliveries.slice(0, 3).map((delivery) => (
          <Link
            key={delivery.id}
            to={`/seller/stores/${storeId}/operations`}
            className="flex flex-col gap-3 rounded-xl border border-danger-100 bg-danger-50 p-4 transition hover:border-danger-200 sm:flex-row sm:items-center"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-danger-600 text-white">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-danger-700">
                Öncelikli teslimat: {delivery.customerName}
              </p>
              <p className="mt-1 text-sm text-danger-700/80">
                {delivery.delayMinutes
                  ? `${delivery.delayMinutes} dk gecikme`
                  : "Teslimat istisnası"}{" "}
                · {delivery.deliveryTime}
              </p>
            </div>
            <span className="text-sm font-semibold text-danger-700">
              Operasyonu aç →
            </span>
          </Link>
        ))}
        {!pendingSubsQuery.isError && pendingSubs?.totalElements ? (
          <Link
            to={`/seller/stores/${storeId}/pending`}
            className="flex flex-col gap-3 rounded-xl border border-warning-100 bg-warning-50 p-4 transition hover:border-warning-200 sm:flex-row sm:items-center"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-warning-600 text-white">
              <BellRing className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning-700">
                Onay bekleyen abonelik talepleri var
              </p>
              <p className="mt-1 text-sm text-warning-700/80">
                Müşterilerin taleplerini zamanında değerlendirmek için mağaza
                operasyon sayfasına gidin.
              </p>
            </div>
            <span className="text-sm font-semibold text-warning-700">
              Talepleri aç →
            </span>
          </Link>
        ) : null}
      </section>

      <section>
        <div className="mf-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="mf-section-title">Bugünün teslimatları</h2>
              <p className="mf-muted mt-1">
                Yaklaşan teslimatları ve anlık durumlarını takip edin.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary-700">
              {deliveriesQuery.isError ? "Veri alınamadı" : `${deliveries.length} kayıt`}
            </span>
          </div>
          {deliveriesQuery.isError ? (
            <div className="p-6">
              <EmptyState
                className="border-0 shadow-none"
                title="Teslimatlar yüklenemedi"
                description="Bağlantıyı kontrol edip tekrar deneyin."
                icon={<PackageCheck className="h-6 w-6" />}
                action={<Button variant="outline" onClick={() => deliveriesQuery.refetch()}>Tekrar dene</Button>}
              />
            </div>
          ) : deliveries.length ? (
            <div className="divide-y divide-slate-100">
              {deliveries.slice(0, 6).map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f2f2f2] text-slate-600">
                      <CookingPot className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {delivery.customerName}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {delivery.menuName} · {delivery.personCount} kişi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-sm font-semibold text-slate-700">
                      {delivery.deliveryTime}
                    </span>
                    <StatusBadge domain="delivery" status={delivery.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                className="border-0 shadow-none"
                title="Bugün planlanmış teslimat yok"
                description="Yeni teslimatlar geldiğinde burada görünecek."
                icon={<PackageCheck className="h-6 w-6" />}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
