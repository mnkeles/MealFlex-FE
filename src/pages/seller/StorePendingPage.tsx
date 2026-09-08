/* eslint-disable @typescript-eslint/no-unused-expressions -- Existing compact SSE handler intentionally ignores unavailable audio playback. */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";
import { sellerService } from "@/services/sellerService";
import QueryBoundary from "@/components/ui/QueryBoundary";
import ConfirmModal from "@/components/common/ConfirmModal";

function remaining(deadline: string | undefined, now: number) {
  if (!deadline) return "SLA tanımsız";
  const ms = new Date(deadline).getTime() - now;
  if (ms <= 0) return "Süre doldu";
  const h = Math.floor(ms / 3_600_000),
    m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h} sa ${m} dk`;
}
function apiError(error: unknown) {
  return (
    (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message || "İşlem tamamlanamadı."
  );
}

export default function StorePendingPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const client = useQueryClient();
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [changeRejectId, setChangeRejectId] = useState<number | null>(null);
  const [changeRejectReason, setChangeRejectReason] = useState("");
  const [now, setNow] = useState(Date.now());
  const [alarm, setAlarm] = useState(false);
  const [slaFilter, setSlaFilter] = useState<"ALL" | "URGENT" | "EXPIRED">(
    "ALL",
  );
  const [sortMode, setSortMode] = useState<"SLA" | "NEWEST" | "OLDEST">(
    "SLA",
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    succeeded: number[];
    failed: number[];
  }>();
  const pending = useQuery({
    queryKey: ["seller-subscriptions", storeId, "PENDING_APPROVAL"],
    queryFn: () =>
      sellerService.getSubscriptionsForStore(
        storeId,
        "PENDING_APPROVAL",
        0,
        50,
      ),
    enabled: !!storeId,
  });
  const unread = useQuery({
    queryKey: ["pending-unread", storeId],
    queryFn: () => sellerService.getPendingUnreadCount(storeId),
    enabled: !!storeId,
    refetchInterval: 30_000,
  });
  const changeRequests = useQuery({
    queryKey: ["delivery-change-requests", storeId],
    queryFn: () => sellerService.getDeliveryChangeRequests(storeId),
    enabled: !!storeId,
  });
  const allSubscriptions = useMemo(
    () => pending.data?.content || [],
    [pending.data],
  );
  const subscriptions = useMemo(() => {
    const urgentLimit = now + 24 * 3_600_000;
    return allSubscriptions
      .filter((subscription) => {
        const deadline = subscription.approvalDeadlineAt
          ? new Date(subscription.approvalDeadlineAt).getTime()
          : Number.POSITIVE_INFINITY;
        if (slaFilter === "EXPIRED") return deadline <= now;
        if (slaFilter === "URGENT") return deadline > now && deadline <= urgentLimit;
        return true;
      })
      .sort((left, right) => {
        if (sortMode === "NEWEST")
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        if (sortMode === "OLDEST")
          return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        const leftDeadline = left.approvalDeadlineAt
          ? new Date(left.approvalDeadlineAt).getTime()
          : Number.POSITIVE_INFINITY;
        const rightDeadline = right.approvalDeadlineAt
          ? new Date(right.approvalDeadlineAt).getTime()
          : Number.POSITIVE_INFINITY;
        return leftDeadline - rightDeadline;
      });
  }, [allSubscriptions, now, slaFilter, sortMode]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!allSubscriptions.length) return;
    sellerService
      .markPendingViewed(storeId)
      .then(() =>
        client.invalidateQueries({ queryKey: ["pending-unread", storeId] }),
      );
  }, [storeId, allSubscriptions.length, client]);
  useEffect(() => {
    if (!storeId) return;
    const controller = new AbortController();
    const connect = async () => {
      try {
        const response = await fetch(
          `/api/v1/seller/subscriptions/stores/${storeId}/stream`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
              Accept: "text/event-stream",
            },
            signal: controller.signal,
          },
        );
        if (!response.body) return;
        const reader = response.body.getReader(),
          decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          buffer += decoder.decode(result.value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const block of events) {
            if (
              block.includes("event:subscription-created") ||
              block.includes("event:delivery-change-requested")
            ) {
              setAlarm(true);
              client.invalidateQueries({
                queryKey: ["seller-subscriptions", storeId],
              });
              client.invalidateQueries({
                queryKey: ["delivery-change-requests", storeId],
              });
              client.invalidateQueries({
                queryKey: ["pending-unread", storeId],
              });
              try {
                const audio = new AudioContext(),
                  osc = audio.createOscillator();
                osc.connect(audio.destination);
                osc.frequency.value = 880;
                osc.start();
                osc.stop(audio.currentTime + 0.18);
              } catch {
                undefined;
              }
            }
          }
        }
      } catch {
        if (!controller.signal.aborted) window.setTimeout(connect, 5000);
      }
    };
    connect();
    return () => controller.abort();
  }, [storeId, client]);
  const approve = useMutation({
    mutationFn: sellerService.approveSubscription,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["seller-subscriptions"] });
      setAlarm(false);
    },
  });
  const bulkApprove = useMutation({
    mutationFn: async (ids: number[]) => {
      const settled = await Promise.allSettled(
        ids.map((id) => sellerService.approveSubscription(id)),
      );
      return settled.reduce(
        (result, item, index) => {
          result[item.status === "fulfilled" ? "succeeded" : "failed"].push(
            ids[index],
          );
          return result;
        },
        { succeeded: [] as number[], failed: [] as number[] },
      );
    },
    onSuccess: (result) => {
      setBulkConfirmOpen(false);
      setBulkResult(result);
      setSelectedIds(new Set(result.failed));
      setAlarm(false);
      client.invalidateQueries({ queryKey: ["seller-subscriptions"] });
    },
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      sellerService.rejectSubscription(id, reason),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["seller-subscriptions"] });
      setRejectId(null);
      setRejectReason("");
      setAlarm(false);
    },
  });
  const approveChange = useMutation({
    mutationFn: sellerService.approveDeliveryChangeRequest,
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["delivery-change-requests", storeId],
      }),
  });
  const rejectChange = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      sellerService.rejectDeliveryChangeRequest(id, reason),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: ["delivery-change-requests", storeId],
      });
      setChangeRejectId(null);
      setChangeRejectReason("");
    },
  });
  return (
    <div
      className={
        alarm ? "rounded-2xl ring-4 ring-warning-300 ring-offset-4" : ""
      }
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Canlı Abonelik Talepleri</h2>
          <p className="mt-1 text-sm text-slate-500">
            Yeni talepler bu ekran açıkken anında görünür.
          </p>
        </div>
        <span
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${(unread.data || 0) > 0 ? "bg-danger-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          <BellRing className="h-4 w-4" />
          {unread.data || 0} okunmamış
        </span>
      </div>
      {alarm && (
        <button
          onClick={() => setAlarm(false)}
          className="mb-4 flex w-full items-center justify-between rounded-xl bg-warning-100 p-4 text-left font-bold text-warning-800"
        >
          <span>🔔 Yeni abonelik talebi geldi!</span>
          <span className="text-xs">Alarmı kapat</span>
        </button>
      )}
      {!!changeRequests.data?.length && (
        <section className="mb-5 rounded-2xl border border-info-200 bg-info-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-info-950">
                Teslimat değişikliği talepleri
              </h3>
              <p className="text-sm text-info-700">
                Müşterilerin teslimat saati ve kişi sayısı için gönderdiği
                talepleri karara bağlayın.
              </p>
            </div>
            <span className="rounded-full bg-info-600 px-3 py-1 text-xs font-black text-white">
              {changeRequests.data.length} talep
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {changeRequests.data.map((request) => (
              <div
                key={request.id}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 lg:flex-row">
                  <div>
                    <strong>{request.customerName}</strong>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Date(request.deliveryDate).toLocaleDateString(
                        "tr-TR",
                      )}{" "}
                      · Saat:{" "}
                      <strong>
                        {request.oldDeliveryTime} →{" "}
                        {request.requestedDeliveryTime}
                      </strong>{" "}
                      · Kişi:{" "}
                      <strong>
                        {request.oldPersonCount} →{" "}
                        {request.requestedPersonCount}
                      </strong>
                    </p>
                    {request.requestedAddress && (
                      <p className="mt-1 text-sm text-slate-600">
                        Adres:{" "}
                        <strong>{request.oldAddress || "Mevcut adres"}</strong>{" "}
                        → <strong>{request.requestedAddress}</strong>
                      </p>
                    )}
                    {request.customerNote && (
                      <p className="mt-2 rounded-lg bg-info-50 p-3 text-sm text-info-800">
                        <strong>Müşteri notu:</strong> {request.customerNote}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveChange.mutate(request.id)}
                      disabled={approveChange.isPending}
                      className="rounded-lg bg-success-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => setChangeRejectId(request.id)}
                      className="rounded-lg bg-danger-50 px-4 py-2 text-sm font-bold text-danger-600"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
                {changeRejectId === request.id && (
                  <div className="mt-3 rounded-lg bg-danger-50 p-3">
                    <textarea
                      autoFocus
                      value={changeRejectReason}
                      onChange={(event) =>
                        setChangeRejectReason(event.target.value)
                      }
                      rows={2}
                      placeholder="Ret gerekçesi"
                      className="w-full rounded-lg border border-danger-200 p-2 text-sm"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => setChangeRejectId(null)}
                        className="px-3 text-sm font-bold"
                      >
                        Vazgeç
                      </button>
                      <button
                        disabled={
                          !changeRejectReason.trim() || rejectChange.isPending
                        }
                        onClick={() =>
                          rejectChange.mutate({
                            id: request.id,
                            reason: changeRejectReason,
                          })
                        }
                        className="rounded-lg bg-danger-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                      >
                        Talebi reddet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <QueryBoundary
        query={pending}
        loadingLabel="Onay bekleyen talepler yükleniyor…"
        errorTitle="Onay bekleyen talepler yüklenemedi"
        errorDescription="Talepler kaybolmadı. Bağlantınızı kontrol edip tekrar deneyin."
        isEmpty={(result) => !result.content.length}
        emptyTitle="Onay bekleyen talep bulunmuyor"
        emptyDescription="Yeni abonelik talepleri geldiğinde burada görünecek."
      >
        {() => (
        <>
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Onay SLA filtresi"
              value={slaFilter}
              onChange={(event) =>
                setSlaFilter(event.target.value as typeof slaFilter)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
            >
              <option value="ALL">Tüm talepler</option>
              <option value="URGENT">24 saatten az kalanlar</option>
              <option value="EXPIRED">Süresi dolanlar</option>
            </select>
            <select
              aria-label="Onay talebi sıralaması"
              value={sortMode}
              onChange={(event) =>
                setSortMode(event.target.value as typeof sortMode)
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
            >
              <option value="SLA">SLA süresi en az</option>
              <option value="NEWEST">En yeni talep</option>
              <option value="OLDEST">En eski talep</option>
            </select>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                aria-label="Görünen taleplerin tümünü seç"
                checked={
                  !!subscriptions.length &&
                  subscriptions.every((subscription) =>
                    selectedIds.has(subscription.id),
                  )
                }
                onChange={(event) =>
                  setSelectedIds((current) => {
                    const next = new Set(current);
                    subscriptions.forEach((subscription) =>
                      event.target.checked
                        ? next.add(subscription.id)
                        : next.delete(subscription.id),
                    );
                    return next;
                  })
                }
              />
              Görünenleri seç ({subscriptions.length})
            </label>
            <button
              type="button"
              onClick={() => setBulkConfirmOpen(true)}
              disabled={!selectedIds.size || bulkApprove.isPending}
              className="ml-auto min-h-11 rounded-xl bg-success-600 px-4 text-sm font-black text-white disabled:opacity-40"
            >
              Seçilenleri kabul et ({selectedIds.size})
            </button>
          </div>
          {bulkResult && (
            <p
              role={bulkResult.failed.length ? "alert" : "status"}
              className={`mt-3 rounded-xl p-3 text-sm font-semibold ${bulkResult.failed.length ? "bg-warning-50 text-warning-800" : "bg-success-50 text-success-800"}`}
            >
              {bulkResult.succeeded.length} talep kabul edildi.
              {bulkResult.failed.length
                ? ` ${bulkResult.failed.length} talep kabul edilemedi: #${bulkResult.failed.join(", #")}.`
                : ""}
            </p>
          )}
        </section>
        {subscriptions.length ? (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const expired =
              !!sub.approvalDeadlineAt &&
              new Date(sub.approvalDeadlineAt).getTime() <= now;
            return (
              <article
                key={sub.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${expired ? "border-danger-300" : "border-slate-200"}`}
              >
                <label className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                  <input
                    type="checkbox"
                    aria-label={`Talep #${sub.id} seç`}
                    checked={selectedIds.has(sub.id)}
                    onChange={(event) =>
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        event.target.checked
                          ? next.add(sub.id)
                          : next.delete(sub.id);
                        return next;
                      })
                    }
                  />
                  Toplu işlem için seç
                </label>
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">
                        TALEP #{sub.id}
                      </span>
                      {!sub.sellerViewedAt && (
                        <span className="rounded-full bg-danger-100 px-2 py-0.5 text-[10px] font-black text-danger-700">
                          YENİ
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${expired ? "bg-danger-100 text-danger-700" : "bg-warning-100 text-warning-700"}`}
                      >
                        <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                        {remaining(sub.approvalDeadlineAt, now)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-black">
                      {sub.customerName || "Müşteri"} · {sub.menuName}
                    </h3>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                      <span className="flex gap-2">
                        <Users className="h-4 w-4 text-primary-600" />
                        {sub.personCount} kişi
                      </span>
                      <span className="flex gap-2">
                        <CalendarDays className="h-4 w-4 text-primary-600" />
                        {new Date(sub.startDate).toLocaleDateString(
                          "tr-TR",
                        )} – {new Date(sub.endDate).toLocaleDateString("tr-TR")}
                      </span>
                      <span className="flex gap-2">
                        <Clock3 className="h-4 w-4 text-primary-600" />
                        {sub.deliveryTime}
                      </span>
                      <span className="flex gap-2 sm:col-span-2">
                        <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
                        {sub.deliveryAddress || sub.addressTitle}
                        {sub.distanceKm != null && ` · ${sub.distanceKm} km`}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-success-50 px-3 py-2 text-xs font-bold text-success-700">
                        {sub.totalAmount.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                    {expired && (
                      <p className="mt-3 flex gap-2 text-xs font-semibold text-danger-600">
                        <AlertTriangle className="h-4 w-4" />
                        SLA doldu; sistem talebi bir sonraki 15 dakikalık
                        kontrolde erteler veya iptal eder.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-start gap-2 lg:sticky lg:top-24">
                    <button
                      onClick={() => approve.mutate(sub.id)}
                      disabled={approve.isPending}
                      className="min-h-12 rounded-xl bg-success-600 px-6 text-sm font-black text-white disabled:opacity-50"
                    >
                      Kabul et
                    </button>
                    <button
                      onClick={() => setRejectId(sub.id)}
                      className="min-h-12 rounded-xl bg-danger-50 px-6 text-sm font-black text-danger-600"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
                {rejectId === sub.id && (
                  <div className="mt-4 rounded-xl bg-danger-50 p-4">
                    <label className="text-xs font-bold text-danger-700">
                      Ret gerekçesi
                      <textarea
                        autoFocus
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-danger-200 p-3 text-sm font-normal text-slate-800"
                      />
                    </label>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => setRejectId(null)}
                        className="px-3 text-sm font-bold"
                      >
                        Vazgeç
                      </button>
                      <button
                        disabled={!rejectReason.trim() || reject.isPending}
                        onClick={() =>
                          reject.mutate({ id: sub.id, reason: rejectReason })
                        }
                        className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                      >
                        Gerekçeyle reddet
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Seçili SLA filtresine uyan talep bulunmuyor.
          </p>
        )}
        </>
        )}
      </QueryBoundary>
      {(approve.isError || reject.isError) && (
        <p className="mt-4 rounded-xl bg-danger-50 p-3 text-sm font-semibold text-danger-700">
          {apiError(approve.error || reject.error)}
        </p>
      )}
      <ConfirmModal
        open={bulkConfirmOpen}
        title="Seçilen talepleri kabul et"
        message={`${selectedIds.size} abonelik talebi kabul edilecek. Kapasite ve ödeme kontrolleri her talep için ayrı çalışır; uygun olmayanlar kabul edilmez.`}
        confirmLabel={`${selectedIds.size} talebi kabul et`}
        pending={bulkApprove.isPending}
        onClose={() => {
          if (!bulkApprove.isPending) setBulkConfirmOpen(false);
        }}
        onConfirm={() => bulkApprove.mutate([...selectedIds])}
      />
    </div>
  );
}
