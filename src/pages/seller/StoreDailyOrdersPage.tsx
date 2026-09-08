import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CookingPot,
  MapPin,
  Truck,
} from "lucide-react";
import {
  sellerService,
  type DeliveryStatusUpdate,
} from "@/services/sellerService";
import type { Delivery, DeliveryStatus } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/common/ConfirmModal";
import { deliveryStatuses, uiStatus } from "@/constants/statuses";

const deliveryStatusOptions: DeliveryStatus[] = [
  "SCHEDULED",
  "PREPARING",
  "IN_TRANSIT",
  "DELIVERY_ATTEMPTED",
  "FAILED",
  "DELIVERED",
  "SKIPPED",
  "CANCELLED",
];

type DialogState = { delivery: Delivery; target: DeliveryStatus };
type CompensationDialogState = { delivery: Delivery };
type BulkDialogState = {
  status: DeliveryStatus;
  ids: number[];
  actionLabel: string;
};
type BulkResult = {
  succeeded: number[];
  failed: number[];
  status: DeliveryStatus;
};

const emptyForm = {
  estimatedDeliveryAt: "",
  delayMinutes: "",
  deliveryCode: "",
  failureReason: "",
  notes: "",
  courierLatitude: "",
  courierLongitude: "",
};

function errorMessage(error: unknown) {
  const candidate = error as { response?: { data?: { message?: string } } };
  return candidate.response?.data?.message || "Teslimat durumu güncellenemedi.";
}

export default function StoreDailyOrdersPage() {
  const queryClient = useQueryClient();
  const { storeId } = useOutletContext<{ storeId: number }>();
  const [dialog, setDialog] = useState<DialogState>();
  const [compensationDialog, setCompensationDialog] =
    useState<CompensationDialogState>();
  const [compensationForm, setCompensationForm] = useState({
    deliveryDate: "",
    deliveryTime: "",
  });
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState<"ALL" | DeliveryStatus>(
    "ALL",
  );
  const [timeFilter, setTimeFilter] = useState<
    "ALL" | "MORNING" | "AFTERNOON" | "EVENING"
  >("ALL");
  const [courierFilter, setCourierFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("");
  const [presentation, setPresentation] = useState<"LIST" | "KANBAN">("LIST");
  const [bulkDialog, setBulkDialog] = useState<BulkDialogState>();
  const [bulkResult, setBulkResult] = useState<BulkResult>();

  const deliveriesQuery = useQuery({
    queryKey: ["seller-deliveries-today", storeId],
    queryFn: () => sellerService.getTodaysDeliveries(storeId),
    enabled: !!storeId,
  });
  const deliveries = useMemo(() => deliveriesQuery.data ?? [], [deliveriesQuery.data]);
  const deliverySlotsQuery = useQuery({
    queryKey: ["seller-delivery-slots", storeId],
    queryFn: () => sellerService.getDeliverySlots(storeId),
    enabled: !!storeId,
  });
  const { data: routePlan } = useQuery({
    queryKey: ["seller-route-plan", storeId],
    queryFn: () =>
      sellerService.getRoutePlan(
        storeId,
        new Date().toISOString().slice(0, 10),
      ),
    enabled: !!storeId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DeliveryStatusUpdate }) =>
      sellerService.updateDeliveryStatus(storeId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["seller-deliveries-today", storeId],
      });
      setDialog(undefined);
      setForm(emptyForm);
    },
  });
  const bulkMutation = useMutation({
    mutationFn: async ({ status, ids }: { status: DeliveryStatus; ids: number[] }) => {
      const settled = await Promise.allSettled(
        ids.map((id) =>
          sellerService.updateDeliveryStatus(storeId, id, { status }),
        ),
      );
      return settled.reduce<BulkResult>(
        (result, item, index) => {
          result[item.status === "fulfilled" ? "succeeded" : "failed"].push(
            ids[index],
          );
          return result;
        },
        { succeeded: [], failed: [], status },
      );
    },
    onSuccess: (result) => {
      setBulkDialog(undefined);
      setBulkResult(result);
      queryClient.invalidateQueries({
        queryKey: ["seller-deliveries-today", storeId],
      });
    },
  });
  const compensationMutation = useMutation({
    mutationFn: ({
      deliveryId,
      deliveryDate,
      deliveryTime,
    }: {
      deliveryId: number;
      deliveryDate: string;
      deliveryTime: string;
    }) =>
      sellerService.rescheduleFailedDelivery(
        storeId,
        deliveryId,
        deliveryDate,
        deliveryTime,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["seller-deliveries-today", storeId],
      });
      setCompensationDialog(undefined);
      setCompensationForm({ deliveryDate: "", deliveryTime: "" });
    },
  });
  const courierOptions = useMemo(
    () => [
      ...new Map(
        deliveries
          .filter((delivery) => delivery.courierId)
          .map((delivery) => [
            String(delivery.courierId),
            delivery.courierName || `Kurye #${delivery.courierId}`,
          ]),
      ).entries(),
    ],
    [deliveries],
  );
  const visibleDeliveries = useMemo(
    () =>
      deliveries.filter((delivery) => {
        if (statusFilter !== "ALL" && delivery.status !== statusFilter)
          return false;
        if (
          courierFilter !== "ALL" &&
          String(delivery.courierId) !== courierFilter
        )
          return false;
        const hour = Number(delivery.deliveryTime?.slice(0, 2) || 0);
        if (timeFilter === "MORNING" && hour >= 12) return false;
        if (timeFilter === "AFTERNOON" && (hour < 12 || hour >= 17))
          return false;
        if (timeFilter === "EVENING" && hour < 17) return false;
        return (
          !regionFilter.trim() ||
          (delivery.deliveryAddressDetails || delivery.deliveryAddress || "")
            .toLocaleLowerCase("tr-TR")
            .includes(regionFilter.trim().toLocaleLowerCase("tr-TR"))
        );
      }),
    [deliveries, statusFilter, courierFilter, timeFilter, regionFilter],
  );
  const exceptions = useMemo(
    () =>
      deliveries.filter(
        (delivery) =>
          ["FAILED", "DELIVERY_ATTEMPTED"].includes(delivery.status) ||
          !!delivery.delayMinutes,
      ),
    [deliveries],
  );
  const scheduledIds = deliveries
    .filter((delivery) => delivery.status === "SCHEDULED")
    .map((delivery) => delivery.id);
  const preparingIds = deliveries
    .filter((delivery) => delivery.status === "PREPARING")
    .map((delivery) => delivery.id);

  const directUpdate = (delivery: Delivery, status: DeliveryStatus) =>
    updateMutation.mutate({ id: delivery.id, data: { status } });
  const openDialog = (delivery: Delivery, target: DeliveryStatus) => {
    setForm({
      ...emptyForm,
      estimatedDeliveryAt: delivery.estimatedDeliveryAt?.slice(0, 16) || "",
      delayMinutes: delivery.delayMinutes?.toString() || "",
      courierLatitude: delivery.courierLatitude?.toString() || "",
      courierLongitude: delivery.courierLongitude?.toString() || "",
    });
    setDialog({ delivery, target });
    updateMutation.reset();
  };
  const submitDialog = () => {
    if (!dialog) return;
    updateMutation.mutate({
      id: dialog.delivery.id,
      data: {
        status: dialog.target,
        estimatedDeliveryAt: form.estimatedDeliveryAt
          ? new Date(form.estimatedDeliveryAt).toISOString()
          : undefined,
        delayMinutes: form.delayMinutes ? Number(form.delayMinutes) : undefined,
        deliveryCode: form.deliveryCode || undefined,
        failureReason: form.failureReason || undefined,
        notes: form.notes || undefined,
        courierLatitude: form.courierLatitude
          ? Number(form.courierLatitude)
          : undefined,
        courierLongitude: form.courierLongitude
          ? Number(form.courierLongitude)
          : undefined,
      },
    });
  };
  const openCompensationDialog = (delivery: Delivery) => {
    setCompensationForm({
      deliveryDate: delivery.suggestedCompensationDate || "",
      deliveryTime: delivery.deliveryTime.slice(0, 5),
    });
    setCompensationDialog({ delivery });
    compensationMutation.reset();
  };
  const submitCompensation = () => {
    if (!compensationDialog) return;
    compensationMutation.mutate({
      deliveryId: compensationDialog.delivery.id,
      deliveryDate: compensationForm.deliveryDate,
      deliveryTime: compensationForm.deliveryTime,
    });
  };

  const requiresFailureReason =
    dialog?.target === "DELIVERY_ATTEMPTED" || dialog?.target === "FAILED";
  const requiresDeliveryCode = dialog?.target === "DELIVERED";
  const dialogValid =
    (!requiresFailureReason || !!form.failureReason.trim()) &&
    (!requiresDeliveryCode || /^\d{4}$/.test(form.deliveryCode));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Canlı operasyon"
        title="Bugünün teslimatları"
        description="Hazırlık, kurye, teslimat denemesi ve kanıt akışını tek ekrandan yönetin."
      />
      {routePlan?.stops.length ? (
        <section className="mb-4 rounded-2xl border border-info-200 bg-info-50 p-4">
          <h3 className="font-black text-info-900">Rota önerisi</h3>
          <p className="mt-1 text-xs text-info-800">{routePlan.method}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {routePlan.stops.map((stop) => (
              <span
                key={stop.deliveryId}
                className="rounded-lg bg-white px-3 py-2 text-xs text-slate-700"
              >
                <strong>{stop.suggestedSequence}. durak</strong> · #
                {stop.deliveryId} · {stop.distanceKmFromPrevious} km · ~
                {stop.estimatedTravelMinutes} dk
              </span>
            ))}
          </div>
        </section>
      ) : null}
      <div className="mf-surface flex flex-wrap items-center gap-2 p-3">
        <select
          aria-label="Teslimat durumu filtresi"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "ALL" | DeliveryStatus)
          }
          className="mf-input w-auto min-w-36"
        >
          <option value="ALL">Tüm durumlar</option>
          {deliveryStatusOptions.map((value) => (
            <option key={value} value={value}>
              {uiStatus(deliveryStatuses, value).label}
            </option>
          ))}
        </select>
        <select
          aria-label="Teslimat saati filtresi"
          value={timeFilter}
          onChange={(event) =>
            setTimeFilter(event.target.value as typeof timeFilter)
          }
          className="mf-input w-auto min-w-36"
        >
          <option value="ALL">Tüm saatler</option>
          <option value="MORNING">Sabah (00:00–11:59)</option>
          <option value="AFTERNOON">Öğle (12:00–16:59)</option>
          <option value="EVENING">Akşam (17:00+)</option>
        </select>
        <select
          aria-label="Kurye filtresi"
          value={courierFilter}
          onChange={(event) => setCourierFilter(event.target.value)}
          className="mf-input w-auto min-w-36"
        >
          <option value="ALL">Tüm kuryeler</option>
          {courierOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <input
          aria-label="Bölge veya mahalle filtresi"
          value={regionFilter}
          onChange={(event) => setRegionFilter(event.target.value)}
          placeholder="Bölge / mahalle ara"
          className="mf-input min-w-44 flex-1"
        />
        <div className="flex rounded-xl border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => setPresentation("LIST")}
            className={`rounded-lg px-3 py-2 text-xs font-bold ${presentation === "LIST" ? "bg-slate-900 text-white" : "text-slate-600"}`}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setPresentation("KANBAN")}
            className={`rounded-lg px-3 py-2 text-xs font-bold ${presentation === "KANBAN" ? "bg-slate-900 text-white" : "text-slate-600"}`}
          >
            Kanban
          </button>
        </div>
        <button
          onClick={() => {
            setBulkResult(undefined);
            setBulkDialog({
              status: "PREPARING",
              ids: scheduledIds,
              actionLabel: "hazırlamaya al",
            });
          }}
          disabled={!scheduledIds.length || bulkMutation.isPending}
          className="h-11 rounded-xl bg-warning-600 px-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Tümünü hazırlamaya al ({scheduledIds.length})
        </button>
        <button
          onClick={() => {
            setBulkResult(undefined);
            setBulkDialog({
              status: "IN_TRANSIT",
              ids: preparingIds,
              actionLabel: "yola çıkar",
            });
          }}
          disabled={!preparingIds.length || bulkMutation.isPending}
          className="h-11 rounded-xl bg-info-600 px-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Hazırları yola çıkar ({preparingIds.length})
        </button>
      </div>
      {bulkResult && (
        <section
          role={bulkResult.failed.length ? "alert" : "status"}
          className={`rounded-2xl border p-4 text-sm ${
            bulkResult.failed.length
              ? "border-warning-200 bg-warning-50 text-warning-900"
              : "border-success-200 bg-success-50 text-success-900"
          }`}
        >
          <p className="font-black">Toplu işlem tamamlandı</p>
          <p className="mt-1">
            {bulkResult.succeeded.length} teslimat güncellendi.
            {bulkResult.failed.length
              ? ` ${bulkResult.failed.length} teslimat güncellenemedi: #${bulkResult.failed.join(", #")}.`
              : ""}
          </p>
          {!!bulkResult.failed.length && (
            <button
              type="button"
              onClick={() =>
                setBulkDialog({
                  status: bulkResult.status,
                  ids: bulkResult.failed,
                  actionLabel:
                    bulkResult.status === "PREPARING"
                      ? "hazırlamaya al"
                      : "yola çıkar",
                })
              }
              className="mt-3 rounded-lg border border-warning-300 bg-white px-3 py-2 text-xs font-black"
            >
              Başarısızları tekrar dene
            </button>
          )}
        </section>
      )}
      {!!exceptions.length && (
        <section className="mb-4 rounded-2xl border border-danger-200 bg-danger-50 p-4">
          <h3 className="flex items-center gap-2 font-black text-danger-800">
            <AlertTriangle className="h-5 w-5" />
            Operasyon istisnaları ({exceptions.length})
          </h3>
          <div className="mt-2 space-y-1 text-sm text-danger-700">
            {exceptions.map((delivery) => (
              <p key={delivery.id}>
                #{delivery.id} · {delivery.customerName} ·{" "}
                {uiStatus(deliveryStatuses, delivery.status).label}
                {delivery.delayMinutes
                  ? ` · ${delivery.delayMinutes} dk gecikme`
                  : ""}
                {delivery.failureReason ? ` · ${delivery.failureReason}` : ""}
              </p>
            ))}
          </div>
        </section>
      )}

      {presentation === "KANBAN" &&
        !deliveriesQuery.isLoading &&
        !deliveriesQuery.isError &&
        !!visibleDeliveries.length && (
          <section className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-4">
            {(
              [
                "SCHEDULED",
                "PREPARING",
                "IN_TRANSIT",
                "DELIVERED",
              ] as DeliveryStatus[]
            ).map((status) => {
              const columnItems = visibleDeliveries.filter(
                (item) => item.status === status,
              );
              return (
                <div
                  key={status}
                  className="min-w-64 rounded-2xl bg-slate-100 p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge domain="delivery" status={status} />
                    <span className="text-xs font-bold text-slate-500">
                      {columnItems.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {columnItems.length ? (
                      columnItems.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-xl bg-white p-3 shadow-sm"
                        >
                          <p className="text-sm font-black">
                            {item.deliveryTime} · {item.customerName}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {item.menuName} · {item.personCount} kişi
                          </p>
                          <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                            {item.deliveryAddressDetails ||
                              item.deliveryAddress}
                          </p>
                          {item.customerPhoneMasked && (
                            <p className="mt-1 text-xs text-slate-500">
                              Tel: {item.customerPhoneMasked}
                            </p>
                          )}
                          {item.notes && (
                            <p className="mt-1 rounded bg-info-50 px-2 py-1 text-xs text-info-700">
                              Not: {item.notes}
                            </p>
                          )}
                        </article>
                      ))
                    ) : (
                      <p className="py-5 text-center text-xs text-slate-500">
                        Kayıt yok
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      {deliveriesQuery.isLoading ? (
        <div className="py-12 text-center text-slate-500">Yükleniyor...</div>
      ) : deliveriesQuery.isError ? (
        <EmptyState
          title="Teslimatlar yüklenemedi"
          description="Bağlantıyı kontrol edip tekrar deneyin. Sorun devam ederse destek ekibiyle iletişime geçin."
          icon={<AlertTriangle className="h-6 w-6" />}
          action={
            <Button
              variant="outline"
              onClick={() => void deliveriesQuery.refetch()}
            >
              Tekrar dene
            </Button>
          }
        />
      ) : deliveries.length === 0 ? (
        <EmptyState
          title="Bugün teslimat bulunmuyor"
          description="Yeni planlanan teslimatlar burada görünecek."
          icon={<Truck className="h-6 w-6" />}
        />
      ) : !visibleDeliveries.length ? (
        <EmptyState
          title="Bu filtrede teslimat bulunmuyor"
          description="Filtreleri değiştirerek teslimatları tekrar görüntüleyin."
        />
      ) : (
        <div
          className={`${presentation === "KANBAN" ? "hidden" : ""} mf-surface divide-y divide-slate-100 overflow-hidden`}
        >
          {visibleDeliveries.map((delivery) => {
            return (
              <div key={delivery.id} className="p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-3">
                      <span className="text-lg font-black text-primary-600">
                        {delivery.deliveryTime}
                      </span>
                      <StatusBadge domain="delivery" status={delivery.status} />
                      {delivery.delayMinutes ? (
                        <span className="text-xs font-bold text-danger-600">
                          {delivery.delayMinutes} dk gecikme
                        </span>
                      ) : null}
                    </div>
                    <p className="font-medium">{delivery.customerName}</p>
                    <p className="text-sm text-slate-500">
                      {delivery.menuName} · {delivery.personCount} kişi
                    </p>
                    {(delivery.deliveryAddressDetails ||
                      delivery.deliveryAddress) && (
                      <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {delivery.deliveryAddressDetails ||
                          delivery.deliveryAddress}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {delivery.estimatedDeliveryAt && (
                        <span>
                          <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                          Tahmini:{" "}
                          {new Date(
                            delivery.estimatedDeliveryAt,
                          ).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {delivery.statusChangedAt && (
                        <span>
                          Son güncelleme:{" "}
                          {new Date(
                            delivery.statusChangedAt,
                          ).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {delivery.receiverName && (
                        <span>Teslim alan: {delivery.receiverName}</span>
                      )}
                      {delivery.courierLatitude != null &&
                        delivery.courierLongitude != null && (
                          <a
                            className="font-bold text-info-600"
                            target="_blank"
                            rel="noreferrer"
                            href={
                              "https://www.openstreetmap.org/?mlat=" +
                              delivery.courierLatitude +
                              "&mlon=" +
                              delivery.courierLongitude
                            }
                          >
                            Kurye konumunu aç
                          </a>
                        )}
                    </div>
                    {delivery.failureReason && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-danger-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {delivery.failureReason}
                      </p>
                    )}
                    {delivery.compensationStatus === "OFFERED" && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-info-700">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Telafi bekliyor
                        {delivery.suggestedCompensationDate
                          ? ` · Önerilen gün: ${new Date(`${delivery.suggestedCompensationDate}T00:00:00`).toLocaleDateString("tr-TR")}`
                          : ""}
                      </p>
                    )}
                    {delivery.compensationStatus === "RESCHEDULED" && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-success-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Telafi teslimatı
                        planlandı
                      </p>
                    )}
                    {delivery.notes && (
                      <p className="mt-1 text-xs text-info-600">
                        Not: {delivery.notes}
                      </p>
                    )}
                    {delivery.customerNote && (
                      <p className="mt-2 rounded-lg bg-warning-50 p-2 text-xs font-semibold text-warning-800">
                        Müşteri teslimat notu: {delivery.customerNote}
                      </p>
                    )}
                    {delivery.proofPhotoUrl && (
                      <a
                        href={delivery.proofPhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-bold text-success-700 underline"
                      >
                        Teslimat kanıtını görüntüle
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {delivery.status === "SCHEDULED" && (
                      <>
                        <button
                          onClick={() => directUpdate(delivery, "PREPARING")}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 rounded-lg bg-warning-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          <CookingPot className="h-4 w-4" /> Hazırlamaya başla
                        </button>
                        <button
                          onClick={() => openDialog(delivery, "FAILED")}
                          className="rounded-lg border border-danger-200 px-3 py-2 text-sm font-medium text-danger-600"
                        >
                          Sorun bildir
                        </button>
                      </>
                    )}
                    {delivery.status === "PREPARING" && (
                      <>
                        <button
                          onClick={() => directUpdate(delivery, "IN_TRANSIT")}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-1 rounded-lg bg-info-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          <Truck className="h-4 w-4" /> Yola çıkar
                        </button>
                        <button
                          onClick={() => openDialog(delivery, "FAILED")}
                          className="rounded-lg border border-danger-200 px-3 py-2 text-sm font-medium text-danger-600"
                        >
                          Başarısız
                        </button>
                      </>
                    )}
                    {delivery.status === "IN_TRANSIT" && (
                      <>
                        <button
                          onClick={() => openDialog(delivery, "DELIVERED")}
                          className="flex items-center gap-1 rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Teslim et
                        </button>
                        <button
                          onClick={() =>
                            openDialog(delivery, "DELIVERY_ATTEMPTED")
                          }
                          className="rounded-lg border border-warning-200 px-3 py-2 text-sm font-medium text-warning-700"
                        >
                          Teslim edilemedi
                        </button>
                        <button
                          onClick={() => openDialog(delivery, "FAILED")}
                          className="rounded-lg border border-danger-200 px-3 py-2 text-sm font-medium text-danger-600"
                        >
                          Başarısız
                        </button>
                      </>
                    )}
                    {delivery.status === "DELIVERY_ATTEMPTED" && (
                      <>
                        <button
                          onClick={() => openDialog(delivery, "IN_TRANSIT")}
                          className="rounded-lg bg-info-600 px-4 py-2 text-sm font-medium text-white"
                        >
                          Yeniden dene
                        </button>
                        <button
                          onClick={() => openDialog(delivery, "DELIVERED")}
                          className="rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white"
                        >
                          Teslim et
                        </button>
                        <button
                          onClick={() => openDialog(delivery, "FAILED")}
                          className="rounded-lg border border-danger-200 px-3 py-2 text-sm font-medium text-danger-600"
                        >
                          Sonlandır
                        </button>
                      </>
                    )}
                    {delivery.status === "FAILED" &&
                      delivery.compensationStatus === "OFFERED" && (
                        <button
                          onClick={() => openCompensationDialog(delivery)}
                          className="flex items-center gap-1 rounded-lg bg-info-600 px-4 py-2 text-sm font-medium text-white"
                        >
                          <CalendarClock className="h-4 w-4" /> Telafiyi planla
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={!!bulkDialog}
        title="Toplu teslimat güncellemesi"
        message={
          bulkDialog
            ? `${bulkDialog.ids.length} teslimatı topluca ${bulkDialog.actionLabel} işlemi uygulanacak. Devam etmek istiyor musunuz?`
            : ""
        }
        confirmLabel={
          bulkDialog
            ? `${bulkDialog.ids.length} teslimatı güncelle`
            : "Güncelle"
        }
        pending={bulkMutation.isPending}
        onClose={() => {
          if (!bulkMutation.isPending) setBulkDialog(undefined);
        }}
        onConfirm={() => {
          if (bulkDialog) {
            bulkMutation.mutate({
              status: bulkDialog.status,
              ids: bulkDialog.ids,
            });
          }
        }}
      />

      {dialog && (
        <Modal
          open
          title={uiStatus(deliveryStatuses, dialog.target).label}
          initialFocusSelector="[data-delivery-dialog-initial-focus]"
          onClose={() => {
            if (!updateMutation.isPending) setDialog(undefined);
          }}
          footer={
            <>
              <button
                onClick={() => setDialog(undefined)}
                disabled={updateMutation.isPending}
                className="rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={submitDialog}
                disabled={!dialogValid || updateMutation.isPending}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {requiresDeliveryCode
                  ? "Teslim edildi olarak işaretle"
                  : "Durumu güncelle"}
              </button>
            </>
          }
        >
            <p className="mt-1 text-sm text-slate-500">
              #{dialog.delivery.id} teslimatı için operasyon bilgisini girin.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(dialog.target === "IN_TRANSIT" ||
                dialog.target === "DELIVERY_ATTEMPTED") && (
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                  Tahmini teslim zamanı
                  <input
                    type="datetime-local"
                    value={form.estimatedDeliveryAt}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        estimatedDeliveryAt: event.target.value,
                      })
                    }
                    className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                  />
                </label>
              )}
              {(dialog.target === "IN_TRANSIT" ||
                dialog.target === "DELIVERY_ATTEMPTED") && (
                <label className="text-xs font-bold text-slate-600">
                  Gecikme (dk)
                  <input
                    type="number"
                    min="0"
                    value={form.delayMinutes}
                    onChange={(event) =>
                      setForm({ ...form, delayMinutes: event.target.value })
                    }
                    className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                  />
                </label>
              )}
              {requiresDeliveryCode && (
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                  Müşteri teslimat kodu
                  <input
                    data-delivery-dialog-initial-focus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    value={form.deliveryCode}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        deliveryCode: event.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="4 haneli kod"
                    className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                  />
                </label>
              )}
              {requiresFailureReason && (
                <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                  Başarısızlık nedeni *
                  <textarea
                    required
                    rows={3}
                    value={form.failureReason}
                    onChange={(event) =>
                      setForm({ ...form, failureReason: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border p-3 text-sm font-normal"
                  />
                </label>
              )}
              {(dialog.target === "IN_TRANSIT" ||
                dialog.target === "DELIVERY_ATTEMPTED") && (
                <>
                  <label className="text-xs font-bold text-slate-600">
                    Kurye enlemi
                    <input
                      type="number"
                      step="any"
                      value={form.courierLatitude}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          courierLatitude: event.target.value,
                        })
                      }
                      className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600">
                    Kurye boylamı
                    <input
                      type="number"
                      step="any"
                      value={form.courierLongitude}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          courierLongitude: event.target.value,
                        })
                      }
                      className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                    />
                  </label>
                </>
              )}
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                Operasyon notu
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border p-3 text-sm font-normal"
                />
              </label>
            </div>
            {requiresDeliveryCode && (
              <p className="mt-3 text-xs text-slate-500">
                Doğru 4 haneli müşteri kodu onaylandığında teslimat doğrudan
                teslim edildi olarak işaretlenir.
              </p>
            )}
            {updateMutation.isError && (
              <p className="mt-3 text-sm font-semibold text-danger-600">
                {errorMessage(updateMutation.error)}
              </p>
            )}
        </Modal>
      )}

      {compensationDialog && (
        <Modal
          open
          title="Ücretsiz telafi teslimatı"
          onClose={() => {
            if (!compensationMutation.isPending)
              setCompensationDialog(undefined);
          }}
          footer={
            <>
              <button
                onClick={() => setCompensationDialog(undefined)}
                disabled={compensationMutation.isPending}
                className="rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                onClick={submitCompensation}
                disabled={
                  !compensationForm.deliveryDate ||
                  !compensationForm.deliveryTime ||
                  compensationMutation.isPending
                }
                className="rounded-xl bg-info-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Telafiyi planla
              </button>
            </>
          }
        >
            <p className="mt-1 text-sm text-slate-500">
              #{compensationDialog.delivery.id} numaralı başarısız teslimat için
              müşteriden ek ücret alınmadan yeni gün ve saat seçin.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-600">
                Telafi günü
                <input
                  type="date"
                  min={new Date(Date.now() + 86_400_000)
                    .toISOString()
                    .slice(0, 10)}
                  value={compensationForm.deliveryDate}
                  onChange={(event) =>
                    setCompensationForm({
                      ...compensationForm,
                      deliveryDate: event.target.value,
                    })
                  }
                  className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Teslimat saati
                <select
                  value={compensationForm.deliveryTime}
                  onChange={(event) =>
                    setCompensationForm({
                      ...compensationForm,
                      deliveryTime: event.target.value,
                    })
                  }
                  className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                >
                  <option value="">Saat seçin</option>
                  {(deliverySlotsQuery.data ?? []).map((slot) => (
                    <option key={slot.id} value={slot.deliveryTime.slice(0, 5)}>
                      {slot.deliveryTime.slice(0, 5)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {compensationMutation.isError && (
              <p className="mt-3 text-sm font-semibold text-danger-600">
                {errorMessage(compensationMutation.error)}
              </p>
            )}
        </Modal>
      )}
    </div>
  );
}
