import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Download,
  FileWarning,
  MapPinned,
  Users,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function AdminDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today.slice(0, 8) + "01");
  const [endDate, setEndDate] = useState(today);
  const [storeId, setStoreId] = useState("");
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const filter = {
    startDate,
    endDate,
    storeId: storeId ? Number(storeId) : undefined,
  };
  const periodDays = Math.max(
    1,
    Math.round(
      (new Date(`${endDate}T00:00:00`).getTime() -
        new Date(`${startDate}T00:00:00`).getTime()) /
        86_400_000,
    ) + 1,
  );
  const previousStartDate = new Date(
    new Date(`${startDate}T00:00:00`).getTime() - periodDays * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);
  const previousEndDate = new Date(
    new Date(`${endDate}T00:00:00`).getTime() - periodDays * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);
  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminService.getUsers(0, 1),
  });
  const storesCountQuery = useQuery({
    queryKey: ["admin-stores"],
    queryFn: () => adminService.getStores(0, 1),
  });
  const storesQuery = useQuery({
    queryKey: ["admin-stores-filter"],
    queryFn: () => adminService.getStores(0, 100),
  });
  const operationsQuery = useQuery({
    queryKey: ["admin-operations-summary", startDate, endDate, storeId],
    queryFn: () => adminService.getOperationsSummary(filter),
    refetchInterval: 60_000,
  });
  const serviceDemandsQuery = useQuery({
    queryKey: ["admin-service-demands"],
    queryFn: adminService.getServiceDemands,
  });
  const previousOperationsQuery = useQuery({
    queryKey: [
      "admin-operations-summary",
      previousStartDate,
      previousEndDate,
      storeId,
    ],
    queryFn: () =>
      adminService.getOperationsSummary({
        ...filter,
        startDate: previousStartDate,
        endDate: previousEndDate,
      }),
  });
  const exportMutation = useMutation({
    mutationFn: () => adminService.exportOperationsAlerts(filter),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `operasyon-uyarilari-${startDate}-${endDate}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setShowExportConfirm(false);
    },
  });
  const usersData = usersQuery.data;
  const storesData = storesCountQuery.data;
  const stores = storesQuery.data;
  const operations = operationsQuery.data;
  const previousOperations = previousOperationsQuery.data;
  const dashboardHasError =
    usersQuery.isError ||
    storesCountQuery.isError ||
    storesQuery.isError ||
    operationsQuery.isError ||
    serviceDemandsQuery.isError;
  const retryDashboard = () => {
    usersQuery.refetch();
    storesCountQuery.refetch();
    storesQuery.refetch();
    operationsQuery.refetch();
    previousOperationsQuery.refetch();
    serviceDemandsQuery.refetch();
  };
  const alertTone = (type: string) =>
    type.includes("PAYMENT") || type.includes("DELAY") ? "danger" : "warning";
  const alertTarget = (type: string) =>
    type.includes("RISK")
      ? "/admin/risk"
      : type.includes("COMPLAINT")
        ? "/admin/complaints"
        : type.includes("PAYMENT")
          ? "/admin/finance"
          : "/admin/subscriptions";

  return (
    <div className="mf-page">
      <PageHeader
        eyebrow="Platform kontrol merkezi"
        title="Operasyon genel bakışı"
        description="Onay, teslimat, şikâyet, ödeme ve risk görevlerini seçili tarih aralığı için tek noktadan takip edin."
        actions={
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            disabled={operationsQuery.isLoading || operationsQuery.isError}
            onClick={() => {
              exportMutation.reset();
              setShowExportConfirm(true);
            }}
          >
            Maskeli CSV indir
          </Button>
        }
      />

      <section
        className="mf-surface flex flex-wrap items-end gap-3 p-4"
        aria-label="Dashboard filtreleri"
      >
        <label className="min-w-[10rem] flex-1 text-xs font-bold text-slate-600">
          Başlangıç tarihi
          <input
            type="date"
            value={startDate}
            onChange={(event) => {
              const value = event.target.value;
              setStartDate(value);
              if (endDate < value) setEndDate(value);
            }}
            className="mf-input mt-1"
          />
        </label>
        <label className="min-w-[10rem] flex-1 text-xs font-bold text-slate-600">
          Bitiş tarihi
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mf-input mt-1"
          />
        </label>
        <label className="min-w-[13rem] flex-[1.5] text-xs font-bold text-slate-600">
          Mağaza
          <select
            value={storeId}
            onChange={(event) => setStoreId(event.target.value)}
            className="mf-input mt-1"
          >
            <option value="">Tüm mağazalar</option>
            {stores?.content.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-1 text-xs text-slate-500">
          {operationsQuery.isFetching
            ? "Veriler yenileniyor…"
            : "Veriler her 60 saniyede yenilenir."}
        </p>
      </section>

      {dashboardHasError && (
        <section
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-100 bg-danger-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-black text-danger-800">
              Bazı dashboard verileri yüklenemedi
            </p>
            <p className="mt-1 text-sm text-danger-700">
              Eksik veriler sıfır olarak değerlendirilmez. Bağlantıyı kontrol
              edip tekrar deneyin.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={retryDashboard}>
            Tekrar dene
          </Button>
        </section>
      )}

      {exportMutation.isError && (
        <p
          role="alert"
          className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700"
        >
          CSV dosyası oluşturulamadı. Lütfen tekrar deneyin.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Toplam kullanıcı"
          value={usersQuery.isLoading ? "…" : (usersData?.totalElements ?? "—")}
          icon={<Users className="h-5 w-5" />}
          tone="primary"
          detail="Kayıtlı müşteri ve satıcılar"
          to="/admin/users"
        />
        <StatCard
          label="Toplam mağaza"
          value={
            storesCountQuery.isLoading ? "…" : (storesData?.totalElements ?? "—")
          }
          icon={<Building2 className="h-5 w-5" />}
          tone="success"
          detail="Platformdaki mağazalar"
          to="/admin/stores"
        />
        <StatCard
          label="Onay bekleyen abonelik"
          value={
            operationsQuery.isLoading
              ? "…"
              : (operations?.pendingSubscriptions ?? "—")
          }
          icon={<CalendarClock className="h-5 w-5" />}
          tone="warning"
          delta={
            operations && previousOperations
              ? operations.pendingSubscriptions -
                previousOperations.pendingSubscriptions
              : undefined
          }
          detail="Satıcı aksiyonu bekliyor"
          to="/admin/subscriptions"
        />
        <StatCard
          label="Açık şikâyet"
          value={
            operationsQuery.isLoading ? "…" : (operations?.openComplaints ?? "—")
          }
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="danger"
          delta={
            operations && previousOperations
              ? operations.openComplaints - previousOperations.openComplaints
              : undefined
          }
          detail="İnceleme gerektiren kayıtlar"
          to="/admin/complaints"
        />
      </section>

      <section id="operation-tasks" className="mf-surface scroll-mt-24 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mf-section-title">Kritik operasyon uyarıları</h2>
            <p className="mf-muted mt-1">
              Belirlenen eşikleri geçen kayıtlar öncelik sırasıyla listelenir.
            </p>
          </div>
          <StatusBadge
            tone={
              operations?.delayedDeliveries ||
              operations?.slaComplaints ||
              operations?.paymentReviewRequired ||
              operations?.openRiskCases
                ? "danger"
                : "success"
            }
          >
            {operations?.delayedDeliveries ||
            operations?.slaComplaints ||
            operations?.paymentReviewRequired ||
            operations?.openRiskCases
              ? "İnceleme gerekli"
              : "Kritik uyarı yok"}
          </StatusBadge>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <div
            className={`rounded-2xl border p-4 ${operations?.delayedDeliveries ? "border-danger-100 bg-danger-50" : "border-slate-100 bg-slate-50"}`}
          >
            <p className="text-2xl font-black text-ink">
              {operations?.delayedDeliveries ?? 0}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              30 dk+ geciken teslimat
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Operasyon ekibinin anlık kontrolü gerekir.
            </p>
          </div>
          <div
            className={`rounded-2xl border p-4 ${operations?.slaComplaints ? "border-warning-100 bg-warning-50" : "border-slate-100 bg-slate-50"}`}
          >
            <p className="text-2xl font-black text-ink">
              {operations?.slaComplaints ?? 0}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              24 saati aşan şikâyet
            </p>
            <p className="mt-2 text-xs text-slate-500">
              SLA dışına çıkan müşteri talepleri.
            </p>
          </div>
          <div
            className={`rounded-2xl border p-4 ${operations?.paymentReviewRequired ? "border-danger-100 bg-danger-50" : "border-slate-100 bg-slate-50"}`}
          >
            <p className="text-2xl font-black text-ink">
              {operations?.failedPayments ?? 0}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              Başarısız ödeme
            </p>
            <p className="mt-2 text-xs text-slate-500">
              5 ve üzerindeki denemeler incelemeye alınır.
            </p>
          </div>
          <div
            className={`rounded-2xl border p-4 ${operations?.openRiskCases ? "border-danger-100 bg-danger-50" : "border-slate-100 bg-slate-50"}`}
          >
            <p className="text-2xl font-black text-ink">
              {operations?.openRiskCases ?? 0}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-700">
              Risk incelemesi
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Gerekçeli yönetici kararı bekleyen sinyaller.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-2">
          {operations?.alerts?.length ? (
            operations.alerts.map((alert) => (
              <div
                key={`${alert.type}-${alert.id}`}
                className="flex flex-col gap-3 border-b border-slate-100 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-danger-50 text-danger-600">
                    <FileWarning className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-bold text-ink">{alert.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {alert.detail}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge tone={alertTone(alert.type)}>
                    {alert.type}
                  </StatusBadge>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-600">
                    #{alert.id}
                  </span>
                  <Link
                    to={alertTarget(alert.type)}
                    className="rounded-lg border border-primary-200 px-2.5 py-1.5 text-xs font-black text-primary-700 hover:bg-primary-50"
                  >
                    Kaydı aç
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-success-50 text-success-600">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <p className="mt-3 font-black text-ink">
                Seçili aralıkta kritik uyarı yok
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Operasyon göstergeleri normal seviyede.
              </p>
            </div>
          )}
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          Dışa aktarımlar kişisel veri içermez; yalnız işlem türü, kayıt
          numarası ve operasyon özeti paylaşılır.
        </p>
      </section>

      <section className="mf-surface overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <MapPinned className="h-5 w-5" />
          </span>
          <div>
            <h2 className="mf-section-title">Hizmet bekleyen bölgeler</h2>
            <p className="mf-muted mt-1">
              Müşterilerin işletme bulunmayan adreslerden bıraktığı aktif talepler.
            </p>
          </div>
        </div>
        {serviceDemandsQuery.isLoading ? (
          <p className="p-5 text-sm text-slate-500">Bölgesel talepler yükleniyor…</p>
        ) : serviceDemandsQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">İl</th>
                  <th className="px-5 py-3">İlçe</th>
                  <th className="px-5 py-3">Mahalle</th>
                  <th className="px-5 py-3 text-right">Talep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceDemandsQuery.data.map((item) => (
                  <tr key={`${item.city}-${item.district}-${item.neighborhood || ""}`}>
                    <td className="px-5 py-3 font-semibold text-ink">{item.city}</td>
                    <td className="px-5 py-3 text-slate-700">{item.district}</td>
                    <td className="px-5 py-3 text-slate-600">{item.neighborhood || "—"}</td>
                    <td className="px-5 py-3 text-right font-black text-primary-700">
                      {item.requestCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-slate-500">Henüz aktif bölgesel hizmet talebi yok.</p>
        )}
      </section>
      <ConfirmModal
        open={showExportConfirm}
        title="Maskeli operasyon dışa aktarımı"
        message={`${startDate} – ${endDate} aralığı${storeId ? ` ve seçili mağaza` : ""} için yaklaşık ${operations?.alerts?.length ?? 0} kritik uyarı kaydı indirilecek. Dosyada kişisel veri bulunmaz; yalnız işlem türü, kayıt numarası ve özet yer alır.`}
        confirmLabel="CSV indir"
        pending={exportMutation.isPending}
        onClose={() => setShowExportConfirm(false)}
        onConfirm={() => exportMutation.mutate()}
      />
    </div>
  );
}
