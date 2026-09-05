import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  X,
} from "lucide-react";
import { adminService, type AdminSubscription } from "@/services/adminService";
import ConfirmModal from "@/components/common/ConfirmModal";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { subscriptionStatuses } from "@/constants/statuses";
const money = (amount: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    amount,
  );
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("tr-TR").format(new Date(`${value}T00:00:00`))
    : "—";

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const filters = useMemo(
    () => ({
      page,
      size: 20,
      status: status || undefined,
      search: search || undefined,
    }),
    [page, status, search],
  );
  const listQuery = useQuery({
    queryKey: ["admin-subscriptions", filters],
    queryFn: () => adminService.getSubscriptions(filters),
  });
  const detailQuery = useQuery({
    queryKey: ["admin-subscription", selectedId],
    queryFn: () => adminService.getSubscriptionDetail(selectedId!),
    enabled: selectedId !== null,
  });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    queryClient.invalidateQueries({
      queryKey: ["admin-subscription", selectedId],
    });
  };
  const noteMutation = useMutation({
    mutationFn: () => adminService.addSubscriptionNote(selectedId!, reason),
    onSuccess: () => {
      setReason("");
      invalidate();
    },
  });
  const cancelMutation = useMutation({
    mutationFn: () => adminService.cancelSubscription(selectedId!, reason),
    onSuccess: () => {
      setReason("");
      setCancelOpen(false);
      invalidate();
    },
  });
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  };
  const canCancel = (subscription?: AdminSubscription) =>
    subscription &&
    !["COMPLETED", "CANCELLED", "REJECTED"].includes(subscription.status);

  return (
    <div className="mf-page min-w-0 space-y-6">
      <PageHeader
        eyebrow="Operasyon merkezi"
        title="Abonelikler"
        description="Tüm mağazalardaki abonelikleri izleyin, detaylarını inceleyin ve yetkili işlemleri gerekçesiyle kaydedin."
      />

      <form
        onSubmit={submitSearch}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card md:grid-cols-[1fr_220px_auto]"
      >
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Müşteri, e-posta, mağaza veya menü ara"
            className="mf-input w-full pl-10"
          />
        </label>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(0);
          }}
          className="mf-input"
        >
          <option value="">Tüm durumlar</option>
          {Object.entries(subscriptionStatuses).map(([value, item]) => (
            <option key={value} value={value}>
              {item.label}
            </option>
          ))}
        </select>
        <Button type="submit">Filtrele</Button>
      </form>

      {listQuery.isError ? (
        <EmptyState
          title="Abonelikler yüklenemedi"
          description="Bağlantıyı kontrol edip tekrar deneyin."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => listQuery.refetch()}
            >
              Tekrar dene
            </Button>
          }
        />
      ) : (
        <>
      <div className="mf-surface overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Abonelik</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Mağaza / Menü</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {listQuery.isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  Abonelikler yükleniyor…
                </td>
              </tr>
            )}
            {!listQuery.isLoading && listQuery.data?.content.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  Filtreye uygun abonelik bulunamadı.
                </td>
              </tr>
            )}
            {listQuery.data?.content.map((subscription) => (
              <tr
                key={subscription.id}
                className="transition hover:bg-slate-50/80"
              >
                <td className="px-4 py-3 font-bold text-ink">
                  #{subscription.id}
                  <div className="mt-1 text-xs font-normal text-slate-500">
                    {subscription.personCount} kişi ·{" "}
                    {subscription.serviceDayCount} gün
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">
                    {subscription.customerName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {subscription.customerEmail}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-ink">
                    {subscription.storeName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {subscription.menuName}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {date(subscription.startDate)} – {date(subscription.endDate)}
                  <div className="mt-1 text-xs">
                    Sonraki: {date(subscription.nextDeliveryDate)}
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-ink">
                  {money(subscription.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    domain="subscription"
                    status={subscription.status}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    onClick={() => {
                      setSelectedId(subscription.id);
                      setReason("");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    İncele
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {listQuery.data && listQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            disabled={listQuery.data.first}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            variant="outline"
            size="sm"
            aria-label="Önceki sayfa"
          >
            <ChevronLeft size={18} />
          </Button>
          <span className="text-sm text-slate-600">
            Sayfa {listQuery.data.number + 1} / {listQuery.data.totalPages}
          </span>
          <Button
            disabled={listQuery.data.last}
            onClick={() => setPage((value) => value + 1)}
            variant="outline"
            size="sm"
            aria-label="Sonraki sayfa"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      )}
        </>
      )}

      {selectedId !== null && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/30"
          role="dialog"
          aria-modal="true"
          aria-label="Abonelik operasyon detayı"
        >
          <section className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-primary-600">
                  Operasyon kaydı
                </p>
                <h2 className="text-lg font-black">Abonelik #{selectedId}</h2>
                <p className="text-sm text-slate-500">Detay ve işlem geçmişi</p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Detayı kapat"
              >
                <X />
              </button>
            </div>
            {detailQuery.isLoading && (
              <div className="p-8 text-center text-slate-500">
                Detay yükleniyor…
              </div>
            )}
            {detailQuery.isError && (
              <div className="m-5 rounded-xl bg-danger-50 p-4 text-sm text-danger-700">
                Detay yüklenemedi. Lütfen tekrar deneyin.
              </div>
            )}
            {detailQuery.data && (
              <div className="space-y-6 p-5">
                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Müşteri</p>
                    <p className="font-bold">
                      {detailQuery.data.subscription.customerName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {detailQuery.data.subscription.customerEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Mağaza / Menü</p>
                    <p className="font-bold">
                      {detailQuery.data.subscription.storeName}
                    </p>
                    <p className="text-sm text-slate-600">
                      {detailQuery.data.subscription.menuName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Teslimat adresi</p>
                    <p className="text-sm text-slate-700">
                      {detailQuery.data.deliveryAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Toplam tutar</p>
                    <p className="font-bold">
                      {money(detailQuery.data.subscription.totalAmount)}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <CalendarClock size={18} className="text-primary-600" />
                    <h3 className="font-black">Teslimatlar</h3>
                  </div>
                  <div className="space-y-2">
                    {detailQuery.data.deliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong>
                            {date(delivery.deliveryDate)} ·{" "}
                            {delivery.deliveryTime?.slice(0, 5)}
                          </strong>
                          <StatusBadge
                            domain="delivery"
                            status={delivery.status}
                          />
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {delivery.address}
                        </p>
                        {delivery.notes && (
                          <p className="mt-1 text-sm text-slate-500">
                            Not: {delivery.notes}
                          </p>
                        )}
                        {delivery.changeReason && (
                          <p className="mt-1 text-xs text-info-700">
                            {delivery.changeReason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <FileText size={18} className="text-primary-600" />
                    <h3 className="font-black">Yönetici notu ve işlem</h3>
                  </div>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={500}
                    placeholder="Not veya işlem gerekçesi yazın"
                    className="mf-textarea min-h-24 w-full"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      disabled={!reason.trim() || noteMutation.isPending}
                      onClick={() => noteMutation.mutate()}
                      variant="outline"
                      size="sm"
                    >
                      Not ekle
                    </Button>
                    {canCancel(detailQuery.data.subscription) && (
                      <Button
                        disabled={!reason.trim()}
                        onClick={() => setCancelOpen(true)}
                        variant="danger"
                        size="sm"
                      >
                        Aboneliği iptal et
                      </Button>
                    )}
                  </div>
                  {noteMutation.isError || cancelMutation.isError ? (
                    <p className="mt-2 text-sm text-danger-600">
                      İşlem yapılamadı. Gerekçeyi ve abonelik durumunu kontrol
                      edin.
                    </p>
                  ) : null}
                </div>
                <div>
                  <h3 className="mb-2 font-black">İşlem geçmişi</h3>
                  <ol className="space-y-2 border-l-2 border-slate-200 pl-4">
                    {detailQuery.data.events.length === 0 && (
                      <li className="text-sm text-slate-500">
                        Henüz kayıt yok.
                      </li>
                    )}
                    {detailQuery.data.events.map((event) => (
                      <li key={event.id} className="text-sm">
                        <p className="font-semibold text-ink">{event.action}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(event.timestamp).toLocaleString("tr-TR")}
                        </p>
                        {event.newValue && (
                          <p className="mt-1 text-slate-600">
                            {event.newValue}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      <ConfirmModal
        open={cancelOpen}
        title="Aboneliği iptal et"
        message="Gelecek teslimatlar iptal edilir ve uygun ödeme iadesi başlatılır. Bu işlem gerekçesiyle birlikte kayıt altına alınır."
        confirmLabel="İptal et"
        danger
        pending={cancelMutation.isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
      />
    </div>
  );
}
