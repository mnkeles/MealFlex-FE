import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Download,
  MapPin,
  MessageSquareWarning,
  Phone,
  RefreshCw,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { subscriptionService } from "@/services/subscriptionService";
import { storeService } from "@/services/storeService";
import type { Delivery, SubscriptionEvent } from "@/types";
import { paymentService } from "@/services/paymentService";
import ConfirmModal from "@/components/common/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  deliveryChangeCutoffLabel,
  isDeliveryChangeWindowOpen,
} from "@/utils/deliveryChangeWindow";

const eventLabels: Record<string, string> = {
  SUBSCRIPTION_APPROVED: "Abonelik onaylandı",
  SUBSCRIPTION_REJECTED: "Satıcı talebi reddetti",
  SUBSCRIPTION_CANCELLED: "Abonelik iptal edildi",
  SUBSCRIPTION_POSTPONED: "Onay süresi dolduğu için tarihler ertelendi",
  SUBSCRIPTION_AUTO_CANCELLED: "Onay süresi dolduğu için talep iptal edildi",
  SUBSCRIPTION_ACTIVATED: "Abonelik başladı",
  SUBSCRIPTION_COMPLETED: "Abonelik tamamlandı",
  SUBSCRIPTION_EXTENDED: "Abonelik dönemi uzatıldı",
  SUBSCRIPTION_EXTENSION_REQUESTED: "Abonelik uzatılma talebi gönderildi",
  SUBSCRIPTION_EXTENSION_REJECTED: "Abonelik uzatılma talebi reddedildi",
  SUBSCRIPTION_AUTO_RENEW_ENABLED: "Otomatik yenileme açıldı",
  SUBSCRIPTION_AUTO_RENEW_DISABLED: "Otomatik yenileme kapatıldı",
  SUBSCRIPTION_AUTO_RENEWED: "Abonelik otomatik yenilendi",
  SUBSCRIPTION_CANCELLED_BY_SELLER: "İşletme aboneliği iptal etti",
  SUBSCRIPTION_PAYMENT_SUSPENDED: "Ödeme alınamadığı için abonelik durduruldu",
  SUBSCRIPTION_PAYMENT_COMPLETED: "İlk haftalık ödeme tamamlandı",
  SUBSCRIPTION_FROZEN: "Abonelik dönemi donduruldu",
  SUBSCRIPTION_RESUMED: "Abonelik yeniden başlatıldı",
  SUBSCRIPTION_APPROVAL_EXPIRED: "Satıcı onay süresi doldu",
  SUBSCRIPTION_PAYMENT_EXPIRED: "Güvenli ödeme süresi doldu",
};

function eventDetail(event: SubscriptionEvent) {
  if (
    event.action !== "SUBSCRIPTION_POSTPONED" ||
    !event.oldValue ||
    !event.newValue
  )
    return undefined;
  const oldParts = event.oldValue.split("/");
  const newParts = event.newValue.split("/");
  if (oldParts.length < 2 || newParts.length < 2) return undefined;
  const format = (value: string) => new Date(value).toLocaleDateString("tr-TR");
  return `${format(oldParts[0])} – ${format(oldParts[1])} → ${format(newParts[0])} – ${format(newParts[1])}`;
}

function toShortTime(time: string) {
  return time.slice(0, 5);
}

function formatCoveredDates(dates?: string[]) {
  if (!dates?.length) return "Hizmet tarihleri henüz belirlenmedi";
  const format = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  return dates.map(format).join(", ");
}

function extensionErrorMessage(error: unknown) {
  const apiError = (
    error as { response?: { data?: { code?: string; message?: string } } }
  ).response?.data;
  if (apiError?.code && apiError.code !== "INTERNAL_ERROR" && apiError.message) {
    return apiError.message;
  }
  return "Abonelik uzatılırken bir sorun oluştu. Lütfen sayfayı yenileyip tekrar deneyin.";
}

type TimelineTone = "pending" | "approved" | "rejected" | "neutral";

function timelineTone(action: string): TimelineTone {
  if (
    [
      "SUBSCRIPTION_REJECTED",
      "SUBSCRIPTION_EXTENSION_REJECTED",
      "SUBSCRIPTION_CANCELLED",
      "SUBSCRIPTION_AUTO_CANCELLED",
      "SUBSCRIPTION_CANCELLED_BY_SELLER",
      "SUBSCRIPTION_APPROVAL_EXPIRED",
      "SUBSCRIPTION_PAYMENT_SUSPENDED",
      "SUBSCRIPTION_PAYMENT_EXPIRED",
    ].includes(action)
  )
    return "rejected";
  if (
    [
      "SUBSCRIPTION_EXTENSION_REQUESTED",
      "SUBSCRIPTION_POSTPONED",
    ].includes(action)
  )
    return "pending";
  return "approved";
}

function timeWithOffset(time: string, offsetMinutes: number) {
  const [hour, minute] = toShortTime(time).split(":").map(Number);
  const totalMinutes = Math.min(
    23 * 60 + 59,
    Math.max(0, hour * 60 + minute + offsetMinutes),
  );
  return (
    String(Math.floor(totalMinutes / 60)).padStart(2, "0") +
    ":" +
    String(totalMinutes % 60).padStart(2, "0")
  );
}

function DeliveryLiveTracking({ deliveries }: { deliveries: Delivery[] }) {
  const tracked = deliveries.filter((delivery) =>
    ["PREPARING", "IN_TRANSIT", "DELIVERY_ATTEMPTED", "FAILED"].includes(
      delivery.status,
    ),
  );
  if (!tracked.length) return null;
  return (
    <section className="rounded-xl border border-info-200 bg-gradient-to-br from-info-50 to-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-info-600 text-white">
          <Truck className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-xl font-bold">Teslimat takibi</h2>
          <p className="text-sm text-slate-500">
            Operasyon durumu ve tahmini teslim zamanı
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {tracked.map((delivery) => {
          return (
            <div
              key={delivery.id}
              className="rounded-xl border border-info-100 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>
                  {new Date(delivery.deliveryDate).toLocaleDateString("tr-TR")}{" "}
                  · {delivery.deliveryTime}
                </strong>
                <StatusBadge domain="delivery" status={delivery.status} />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                {delivery.courierName && (
                  <span>
                    <Truck className="mr-1 inline h-4 w-4 text-info-600" />
                    Kurye: <strong>{delivery.courierName}</strong>
                  </span>
                )}
                {delivery.courierPhone && delivery.courierPhoneMasked && (
                  <a
                    href={`tel:${delivery.courierPhone}`}
                    className="font-semibold text-info-700 underline"
                    aria-label={`${delivery.courierName || "Kurye"} adlı kuryeyi ara`}
                  >
                    <Phone className="mr-1 inline h-4 w-4" />
                    {delivery.courierPhoneMasked} · Ara
                  </a>
                )}
                {delivery.estimatedDeliveryAt && (
                  <span>
                    <Clock3 className="mr-1 inline h-4 w-4 text-info-600" />
                    Tahmini teslim:{" "}
                    <strong>
                      {new Date(
                        delivery.estimatedDeliveryAt,
                      ).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </span>
                )}
                {delivery.statusChangedAt && (
                  <span>
                    Son güncelleme:{" "}
                    {new Date(delivery.statusChangedAt).toLocaleTimeString(
                      "tr-TR",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                )}
                {delivery.delayMinutes ? (
                  <span className="font-semibold text-danger-600">
                    {delivery.delayMinutes} dakika gecikme bildirildi
                  </span>
                ) : null}
                {delivery.deliveryCode &&
                  !["DELIVERED", "FAILED"].includes(delivery.status) && (
                    <span className="font-bold text-slate-900">
                      Teslimat kodunuz:{" "}
                      <span className="text-lg tracking-widest text-info-700">
                        {delivery.deliveryCode}
                      </span>
                    </span>
                  )}
              </div>
              {delivery.failureReason && (
                <p className="mt-3 flex gap-2 rounded-xl bg-danger-50 p-3 text-sm font-semibold text-danger-700">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  {delivery.failureReason}
                </p>
              )}
              {delivery.receiverName && (
                <p className="mt-2 text-sm text-slate-600">
                  Teslim alan: <strong>{delivery.receiverName}</strong>
                </p>
              )}
              {delivery.proofPhotoUrl && (
                <a
                  href={delivery.proofPhotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-bold text-info-700 underline"
                >
                  Teslimat kanıtını görüntüle
                </a>
              )}
              {delivery.courierLatitude != null &&
                delivery.courierLongitude != null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${delivery.courierLatitude}&mlon=${delivery.courierLongitude}#map=16/${delivery.courierLatitude}/${delivery.courierLongitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 ml-4 inline-block text-sm font-bold text-info-700 underline"
                  >
                    Kurye konumunu aç
                  </a>
                )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function SubscriptionDetailPage() {
  const id = Number(useParams<{ id: string }>().id);
  const queryClient = useQueryClient();
  const location = useLocation();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaint, setComplaint] = useState({
    deliveryId: "",
    reason: "",
    description: "",
  });
  const [message, setMessage] = useState("");
  const [newPaymentMethodId, setNewPaymentMethodId] = useState<number>();
  const [actionDeliveryId, setActionDeliveryId] = useState<number>();
  const [cancelDeliveryId, setCancelDeliveryId] = useState<number>();
  const [showFreeze, setShowFreeze] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [extensionEndDate, setExtensionEndDate] = useState("");
  const [freezeForm, setFreezeForm] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [modifyDeliveryId, setModifyDeliveryId] = useState<number>();
  const [modifyForm, setModifyForm] = useState({
    deliveryTime: "",
    personCount: "",
    customerNote: "",
  });
  const [detailTab, setDetailTab] = useState<
    "summary" | "deliveries" | "payments" | "support"
  >("summary");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["subscription", id],
    queryFn: () => subscriptionService.getSubscription(id),
    enabled: !!id,
  });
  const deliveryBeingModified = data?.deliveries.find(
    (delivery) => delivery.id === modifyDeliveryId,
  );
  const { data: validDeliveryTimes = [] } = useQuery({
    queryKey: [
      "delivery-change-times",
      data?.subscription.storeId,
      deliveryBeingModified?.deliveryDate,
    ],
    queryFn: () =>
      storeService.getDeliveryTimes(
        data!.subscription.storeId,
        deliveryBeingModified!.deliveryDate,
        deliveryBeingModified!.deliveryDate,
      ),
    enabled: !!data?.subscription.storeId && !!deliveryBeingModified,
  });
  const { data: events = [] } = useQuery({
    queryKey: ["subscription-events", id],
    queryFn: () => subscriptionService.getSubscriptionEvents(id),
    enabled: !!id,
  });
  const { data: deliveryChangeRequests = [] } = useQuery({
    queryKey: ["delivery-change-requests", id],
    queryFn: () => subscriptionService.getDeliveryChangeRequests(id),
    enabled: !!id,
  });
  const { data: extensionRequests = [] } = useQuery({
    queryKey: ["extension-requests", id],
    queryFn: () => subscriptionService.getExtensionRequests(id),
    enabled: !!id,
  });
  const { data: paymentSummary } = useQuery({
    queryKey: ["subscription-payment", id],
    queryFn: () => paymentService.summary(id),
    enabled: !!id,
  });
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: paymentService.methods,
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["subscription", id] });
    queryClient.invalidateQueries({ queryKey: ["subscription-events", id] });
    queryClient.invalidateQueries({
      queryKey: ["delivery-change-requests", id],
    });
    queryClient.invalidateQueries({ queryKey: ["extension-requests", id] });
    queryClient.invalidateQueries({ queryKey: ["subscription-payment", id] });
    queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
  };
  const retryPayment = useMutation({
    mutationFn: (paymentId: number) => paymentService.retry(paymentId),
    onSuccess: (payment) => {
      setMessage(
        payment.status === "SUCCEEDED"
          ? "Ödeme başarıyla alındı."
          : "Ödeme tekrar alınamadı. Kartınızı değiştirebilir veya yeniden deneyebilirsiniz.",
      );
      refresh();
    },
    onError: () =>
      setMessage("Ödeme tekrar alınamadı. Kartınızı kontrol edin."),
  });
  const startHostedCheckout = useMutation({
    mutationFn: () => paymentService.startCheckout(id),
    onSuccess: (checkout) => {
      window.location.assign(checkout.paymentPageUrl);
    },
    onError: (error: unknown) => {
      const apiMessage = (
        error as { response?: { data?: { message?: string } } }
      ).response?.data?.message;
      setMessage(
        apiMessage ||
          "Güvenli ödeme sayfası açılamadı. Profil ve iletişim bilgilerinizi kontrol edip tekrar deneyin.",
      );
    },
  });
  const changePaymentMethod = useMutation({
    mutationFn: (paymentMethodId: number) =>
      subscriptionService.changePaymentMethod(id, paymentMethodId),
    onSuccess: (method) => {
      setNewPaymentMethodId(undefined);
      setMessage(
        `Ödeme yöntemi ${method.brand} •••• ${method.lastFour} olarak güncellendi.`,
      );
      refresh();
    },
    onError: () => setMessage("Ödeme yöntemi güncellenemedi."),
  });
  const extendSubscription = useMutation({
    mutationFn: () => subscriptionService.extend(id, extensionEndDate),
    onSuccess: (request) => {
      const requestedEndDate = request.newEndDate || extensionEndDate;
      const formattedEndDate = new Date(
        `${requestedEndDate}T00:00:00`,
      ).toLocaleDateString("tr-TR");
      setShowExtend(false);
      setExtensionEndDate("");
      setMessage(
        `${formattedEndDate} tarihine kadar dönem uzatma talebiniz satıcı onayına gönderildi.`,
      );
      refresh();
    },
    onError: (error: unknown) => {
      refresh();
      setMessage(extensionErrorMessage(error));
    },
  });
  const autoRenewMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      subscriptionService.setAutoRenew(id, enabled),
    onSuccess: (subscription) => {
      setMessage(
        subscription.autoRenew
          ? "Otomatik yenileme açıldı. Fiyat değişirse yenilemeden 7 gün önce bildirim alacaksınız."
          : "Otomatik yenileme kapatıldı.",
      );
      refresh();
    },
    onError: () => setMessage("Otomatik yenileme tercihi güncellenemedi."),
  });
  const cancelDelivery = useMutation({
    mutationFn: (deliveryId: number) =>
      subscriptionService.cancelDelivery(id, deliveryId),
    onSuccess: () => {
      setCancelDeliveryId(undefined);
      setMessage(
        "Yemek servisi iptal talebiniz satıcı onayına gönderildi. Teslimat, satıcı onaylayana kadar planlı kalır.",
      );
      refresh();
    },
    onError: (error: unknown) =>
      setMessage(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Yemek servisi iptal talebi gönderilemedi. Değişiklik son saati geçmiş olabilir.",
      ),
  });
  const freezeSubscription = useMutation({
    mutationFn: () =>
      subscriptionService.freeze(
        id,
        freezeForm.startDate,
        freezeForm.endDate,
        freezeForm.reason || undefined,
      ),
    onSuccess: (result) => {
      setShowFreeze(false);
      setMessage(
        `${result.affectedDeliveryCount} teslimat donduruldu; ${result.adjustmentAmount.toLocaleString("tr-TR")} ${result.currency} düzeltme oluşturuldu.`,
      );
      refresh();
    },
    onError: () =>
      setMessage(
        "Abonelik dondurulamadı. Tarihleri ve değişiklik son saatini kontrol edin.",
      ),
  });
  const changeInput = {
    deliveryTime: modifyForm.deliveryTime || undefined,
    personCount: modifyForm.personCount
      ? Number(modifyForm.personCount)
      : undefined,
    customerNote: modifyForm.customerNote.trim() || undefined,
  };
  const changePreview = useMutation({
    mutationFn: () =>
      subscriptionService.previewDeliveryChange(
        id,
        modifyDeliveryId!,
        changeInput,
      ),
  });
  const applyChange = useMutation({
    mutationFn: () =>
      subscriptionService.changeDelivery(id, modifyDeliveryId!, changeInput),
    onSuccess: () => {
      setModifyDeliveryId(undefined);
      setMessage(
        "Değişiklik talebiniz satıcı onayına gönderildi. Onay veya ret bilgisi size bildirim olarak iletilecek.",
      );
      refresh();
    },
  });
  const openModify = (delivery: Delivery) => {
    if (pendingChangeDeliveryIds.has(delivery.id)) {
      setMessage(
        "Bu teslimat için satıcı onayı bekleyen bir talep var. Karar verildikten sonra yeni talep oluşturabilirsiniz.",
      );
      return;
    }
    if (
      !isDeliveryChangeWindowOpen(
        delivery.deliveryDate,
        data?.changeCutoffTime,
      )
    ) {
      setMessage(
        `Bu teslimat için talep süresi doldu. Son talep zamanı bir önceki gün ${deliveryChangeCutoffLabel(data?.changeCutoffTime)} idi.`,
      );
      return;
    }
    setActionDeliveryId(undefined);
    setModifyDeliveryId(delivery.id);
    setModifyForm({
      deliveryTime: toShortTime(delivery.deliveryTime),
      personCount: String(delivery.personCount),
      customerNote: delivery.customerNote || "",
    });
    changePreview.reset();
    applyChange.reset();
  };
  const selectDetailTab = (tab: typeof detailTab) => {
    setDetailTab(tab);
    const heading = {
      summary: "Teslimat takvimi",
      deliveries: "Teslimat takvimi",
      payments: "Ödemeler",
      support: "İşlemler",
    }[tab];
    window.setTimeout(() => {
      const target =
        tab === "deliveries"
          ? document.getElementById("deliveries")
          : Array.from(document.querySelectorAll("h2"))
              .find((element) => element.textContent?.trim() === heading)
              ?.closest("section");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };
  const cancelMutation = useMutation({
    mutationFn: () => subscriptionService.cancel(id, cancelReason || undefined),
    onSuccess: () => {
      setShowCancel(false);
      setMessage("Aboneliğiniz iptal edildi.");
      refresh();
    },
  });
  const reviewMutation = useMutation({
    mutationFn: () => subscriptionService.createReview(id, rating, comment),
    onSuccess: () => {
      setShowReview(false);
      setMessage("Değerlendirmeniz yayınlandı.");
      refresh();
    },
  });
  const complaintMutation = useMutation({
    mutationFn: () =>
      subscriptionService.createComplaint({
        subscriptionId: id,
        deliveryId: complaint.deliveryId
          ? Number(complaint.deliveryId)
          : undefined,
        reason: complaint.reason,
        description: complaint.description,
      }),
    onSuccess: () => {
      setShowComplaint(false);
      setMessage("Destek talebiniz oluşturuldu.");
      setComplaint({ deliveryId: "", reason: "", description: "" });
    },
  });
  useEffect(() => {
    if (data && location.hash === "#deliveries") {
      document
        .getElementById("deliveries")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data, location.hash]);
  useEffect(() => {
    const result = new URLSearchParams(location.search).get("payment");
    if (result === "success") setMessage("İlk haftalık ödemeniz alındı. Aboneliğiniz onaylandı.");
    if (result === "failed") setMessage("Ödeme tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyin.");
  }, [location.search]);

  if (isLoading)
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200" />;
  if (isError || !data)
    return (
      <div className="mf-page">
        <EmptyState
          title="Abonelik bulunamadı"
          description="Bu kayda erişim yetkiniz olmayabilir veya abonelik artık mevcut olmayabilir."
        />
      </div>
    );
  const sub = data.subscription;
  const pendingExtension = extensionRequests.find(
    (request) => request.status === "PENDING",
  );
  const subscriptionPayments =
    paymentSummary?.payments ??
    (paymentSummary?.payment ? [paymentSummary.payment] : []);
  const modifyingDelivery = deliveryBeingModified;
  const actionDelivery = data.deliveries.find(
    (delivery) => delivery.id === actionDeliveryId,
  );
  const modifyingDeliveryAddress = [
    data.addressTitle || sub.addressTitle,
    modifyingDelivery?.deliveryAddress ||
      data.deliveryAddress ||
      sub.deliveryAddress,
  ]
    .filter(Boolean)
    .join(" · ");
  const hasDeliveryChange = !!modifyingDelivery &&
    (toShortTime(modifyForm.deliveryTime) !==
      toShortTime(modifyingDelivery.deliveryTime) ||
      Number(modifyForm.personCount) !== modifyingDelivery.personCount ||
      modifyForm.customerNote.trim() !== (modifyingDelivery.customerNote || ""));
  const modificationTimeOptions = modifyingDelivery
    ? (() => {
        const nearbyTimes = Array.from(
          new Set(
            Array.from({ length: 9 }, (_, index) =>
              timeWithOffset(modifyingDelivery.deliveryTime, (index - 4) * 15),
            ),
          ),
        );
        const permittedTimes = new Set(
          validDeliveryTimes.map((time) => toShortTime(time)),
        );
        // While the current delivery-slot query is loading, retain only the
        // existing time. This never offers a value the store cannot serve.
        return permittedTimes.size
          ? nearbyTimes.filter((time) => permittedTimes.has(time))
          : [toShortTime(modifyingDelivery.deliveryTime)];
      })()
    : [];
  const modificationPersonBounds = modifyingDelivery
    ? {
        min: Math.max(1, modifyingDelivery.personCount - 5),
        max: modifyingDelivery.personCount + 5,
      }
    : undefined;
  const modificationPersonOptions = modificationPersonBounds
    ? Array.from(
        { length: modificationPersonBounds.max - modificationPersonBounds.min + 1 },
        (_, index) => modificationPersonBounds.min + index,
      )
    : [];
  const deliveryChangeError = (
    applyChange.error as {
      response?: { data?: { message?: string } };
    } | null
  )?.response?.data?.message;
  const deliveryPreviewError = (
    changePreview.error as {
      response?: { data?: { message?: string } };
    } | null
  )?.response?.data?.message;
  const pendingChangeDeliveryIds = new Set(
    deliveryChangeRequests
      .filter((request) => request.status === "PENDING")
      .map((request) => request.deliveryId),
  );
  const canCancel = !["COMPLETED", "CANCELLED", "REJECTED"].includes(
    sub.status,
  );
  const canReview =
    ["ACTIVE", "COMPLETED"].includes(sub.status) && !data.reviewed;
  const approvalEvent = events.find(
    (event) => event.action === "SUBSCRIPTION_APPROVED",
  );
  const isApprovedSubscription =
    Boolean(sub.approvedAt || approvalEvent) ||
    ["ACTIVE", "COMPLETED"].includes(sub.status);
  const initialTimelineStep = {
    key: "subscription-approval",
    label: isApprovedSubscription ? "Abonelik onaylandı" : "Talep oluşturuldu",
    date: approvalEvent?.timestamp || sub.approvedAt || sub.createdAt,
    done: true,
    tone: (isApprovedSubscription ? "approved" : "pending") as TimelineTone,
    detail: undefined,
  };
  const auditedTimeline = events
    .filter(
      (event) =>
        !["SUBSCRIPTION_PAYMENT_METHOD_CHANGED", "SUBSCRIPTION_APPROVED"].includes(
          event.action,
        ),
    )
    .map((event) => ({
      key: `event-${event.id}`,
      label: eventLabels[event.action] ?? "Abonelik bilgileri güncellendi",
      date: event.timestamp,
      detail: eventDetail(event),
      done: true,
      tone: timelineTone(event.action),
    }));
  const timeline = auditedTimeline.length
    ? [
        initialTimelineStep,
        ...auditedTimeline,
      ]
    : [
        initialTimelineStep,
        {
          key: "approval",
          label:
            sub.status === "REJECTED" ? "Talep reddedildi" : "Satıcı onayı",
          date: sub.rejectedAt || sub.approvedAt,
          done: !!(sub.approvedAt || sub.rejectedAt),
          tone: sub.status === "REJECTED" ? "rejected" as TimelineTone : sub.approvedAt ? "approved" as TimelineTone : "pending" as TimelineTone,
          detail: undefined,
        },
        {
          key: "active",
          label: "Abonelik başladı",
          date: ["ACTIVE", "COMPLETED"].includes(sub.status)
            ? sub.startDate
            : undefined,
          done: ["ACTIVE", "COMPLETED"].includes(sub.status),
          tone: ["ACTIVE", "COMPLETED"].includes(sub.status) ? "approved" as TimelineTone : "neutral" as TimelineTone,
          detail: undefined,
        },
        {
          key: "completed",
          label: "Abonelik tamamlandı",
          date: sub.completedAt,
          done: sub.status === "COMPLETED",
          tone: sub.status === "COMPLETED" ? "approved" as TimelineTone : "neutral" as TimelineTone,
          detail: undefined,
        },
      ];

  return (
    <div className="mf-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/subscriptions"
            className="text-sm font-bold text-primary-600"
          >
            ← Aboneliklerime dön
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[.14em] text-primary-600">
            Abonelik yönetimi
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-lg">
              {sub.storeLogoUrl ? (
                <img
                  src={sub.storeLogoUrl}
                  alt={`${sub.storeName} logosu`}
                  className="h-full w-full object-cover"
                />
              ) : (
                "🍽️"
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Catering firması</p>
              <h1 className="text-3xl font-bold tracking-tight text-ink">
                {sub.storeName}
              </h1>
              <p className="text-sm text-slate-500">Abonelik detayı</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sub.status === "PAYMENT_PENDING" && (
            <button
              type="button"
              disabled={startHostedCheckout.isPending}
              onClick={() => startHostedCheckout.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {startHostedCheckout.isPending
                ? "iyzico açılıyor…"
                : "Güvenli ödemeye geç"}
            </button>
          )}
          {sub.status === "COMPLETED" && (
            <Link
              to={`/subscribe?storeId=${sub.storeId}&menuId=${sub.menuId}&addressId=${sub.addressId}&renewFrom=${sub.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </Link>
          )}
          {["APPROVED", "ACTIVE"].includes(sub.status) && (
            <button
              type="button"
              disabled={!!pendingExtension}
              onClick={() => {
                const suggested = new Date(`${sub.endDate}T12:00:00`);
                suggested.setDate(suggested.getDate() + 7);
                setExtensionEndDate(suggested.toISOString().slice(0, 10));
                extendSubscription.reset();
                setShowExtend(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 px-4 py-2 text-sm font-bold text-primary-700 disabled:cursor-not-allowed disabled:border-warning-200 disabled:bg-warning-50 disabled:text-warning-700"
            >
              <CalendarDays className="h-4 w-4" />
              {pendingExtension ? "Uzatma onayı bekleniyor" : "Dönemi uzat"}
            </button>
          )}
          <StatusBadge domain="subscription" status={sub.status} />
        </div>
      </div>
      {sub.status === "COMPLETED" && (
        <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          Aboneliğiniz tamamlandı. <strong>Yenile</strong> ile adres, menü,
          tarih ve ödeme tercihinizi yeniden seçerek yeni bir talep
          oluşturabilirsiniz.
        </div>
      )}
      {message && (
        <div className="rounded-xl bg-success-50 px-4 py-3 text-sm font-semibold text-success-700">
          {message}
        </div>
      )}
      <div
        role="tablist"
        aria-label="Abonelik ayrıntıları"
        className="flex snap-x gap-2 overflow-x-auto rounded-2xl border border-[#e7e7e7] bg-white p-2 shadow-card"
      >
        {(
          [
            { id: "summary", label: "Özet" },
            { id: "deliveries", label: "Teslimatlar" },
            { id: "payments", label: "Ödemeler" },
            { id: "support", label: "Destek ve işlemler" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={detailTab === item.id}
            onClick={() => selectDetailTab(item.id)}
            className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-bold ${detailTab === item.id ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <main className="space-y-6">
          <DeliveryLiveTracking deliveries={data.deliveries} />
          <div id="deliveries" className="scroll-mt-24" />
          {!!deliveryChangeRequests.length && (
            <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Değişiklik taleplerim</h2>
              <p className="mt-1 text-sm text-slate-500">
                Teslimat değişikliği ve yemek servisi iptal taleplerinizin satıcı
                kararlarını buradan takip edebilirsiniz.
              </p>
              <div className="mt-4 space-y-3">
                {deliveryChangeRequests.map((request) => {
                  const config =
                    request.status === "PENDING"
                      ? {
                          label: "Onay bekliyor",
                          color: "bg-warning-100 text-warning-700",
                        }
                      : request.status === "APPROVED"
                        ? {
                            label: "Onaylandı",
                            color: "bg-success-100 text-success-700",
                          }
                        : request.status === "REJECTED"
                          ? {
                              label: "Reddedildi",
                              color: "bg-danger-100 text-danger-700",
                            }
                          : {
                              label: "Uygulandı",
                              color: "bg-slate-100 text-slate-700",
                            };
                  return (
                    <article
                      key={request.id}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong>
                          {new Date(request.deliveryDate).toLocaleDateString(
                            "tr-TR",
                          )}{" "}
                          teslimatı
                        </strong>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      {request.requestType === "CANCEL" ? (
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          Yemek servisi iptal talebi
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-600">
                          Saat:{" "}
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
                      )}
                      {request.decisionReason && (
                        <p className="mt-2 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
                          <strong>Ret gerekçesi:</strong>{" "}
                          {request.decisionReason}
                        </p>
                      )}
                      {request.customerNote && (
                        <p className="mt-2 rounded-2xl bg-[#f7f7f7] p-3 text-sm text-slate-700">
                          <strong>
                            {request.requestType === "CANCEL"
                              ? "Talep nedeni:"
                              : "Teslimat notu:"}
                          </strong>{" "}
                          {request.customerNote}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {["APPROVED", "ACTIVE"].includes(sub.status) && (
            <details className="group rounded-xl border border-info-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
                <div>
                  <h2 className="text-xl font-bold">
                    Teslimat işlemleri
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Bir tarih seçerek değişiklik ya da yemek servisi iptal talebi
                    gönderin; birden fazla gün için tarih aralığını dondurun.
                  </p>
                </div>
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-info-100 px-6 pb-6 pt-4">
                <p className="text-sm text-slate-500">
                  Tarih üzerindeki iki işlem de satıcı onayına gönderilir.
                  Satıcı kararını size bildirim olarak iletir.
                </p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Teslimat değişikliği veya yemek servisi iptal talebi,
                  teslimattan bir gün önce saat{" "}
                  {deliveryChangeCutoffLabel(data.changeCutoffTime)}’e kadar
                  gönderilebilir.
                </p>
                {pendingChangeDeliveryIds.size > 0 && (
                  <p className="mt-3 rounded-xl bg-warning-50 p-3 text-sm font-semibold text-warning-700">
                    Onay bekleyen bir teslimata ikinci talep gönderilemez.
                    Satıcının kararından sonra yeniden talep oluşturabilirsiniz.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFreeze(true)}
                    className="rounded-xl bg-info-600 px-4 py-2 text-sm font-bold text-white"
                  >
                    Tarih aralığını dondur
                  </button>
                  {data.deliveries
                    .filter(
                      (delivery) =>
                        delivery.status === "SCHEDULED" &&
                        new Date(
                          `${delivery.deliveryDate}T${delivery.deliveryTime}`,
                        ) > new Date(),
                    )
                    .slice(0, 8)
                    .map((delivery) => {
                      const isWindowOpen = isDeliveryChangeWindowOpen(
                        delivery.deliveryDate,
                        data.changeCutoffTime,
                      );
                      const isPending = pendingChangeDeliveryIds.has(
                        delivery.id,
                      );
                      const isDisabled = isPending || !isWindowOpen;
                      return (
                        <button
                          key={delivery.id}
                          onClick={() => setActionDeliveryId(delivery.id)}
                          disabled={isDisabled}
                          title={
                            isPending
                              ? "Bu teslimat için satıcı onayı bekleniyor."
                              : !isWindowOpen
                                ? `Talep süresi bir önceki gün ${deliveryChangeCutoffLabel(data.changeCutoffTime)}’de sona erdi.`
                                : undefined
                          }
                          className="rounded-xl border border-info-200 px-3 py-2 text-xs font-bold text-info-700 hover:bg-info-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {new Date(delivery.deliveryDate).toLocaleDateString(
                            "tr-TR",
                          )}{" "}
                          {isPending
                            ? "için talep onayı bekleniyor"
                            : !isWindowOpen
                              ? "için talep süresi doldu"
                              : "teslimatı"}
                        </button>
                      );
                    })}
                </div>
              </div>
            </details>
          )}
          {paymentSummary && (
            <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold">
                    <CreditCard className="h-5 w-5 text-primary-600" />
                    Ödemeler
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tutar, catering firması, hizmet tarihleri ve kullanılan kart
                  </p>
                </div>
                {paymentSummary.invoiceId && (
                  <button
                    onClick={() =>
                      paymentService.downloadInvoice(paymentSummary.invoiceId!)
                    }
                    className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold text-slate-600"
                  >
                    <Download className="h-4 w-4" /> Dekont indir
                  </button>
                )}
              </div>
              {subscriptionPayments.length ? (
                <div className="mt-5 space-y-3">
                  {subscriptionPayments.map((payment) => (
                    <article key={payment.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {payment.storeName ?? sub.storeName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {payment.paidAt ? "Ödeme" : "İşlem"} tarihi:{" "}
                            {new Date(payment.paidAt ?? payment.createdAt).toLocaleString("tr-TR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <strong className="block text-lg">
                            {payment.grossAmount.toLocaleString("tr-TR")} {payment.currency}
                          </strong>
                          <StatusBadge domain="payment" status={payment.status} />
                        </div>
                      </div>
                      <dl className="mt-4 grid gap-3 rounded-2xl bg-[#f7f7f7] p-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-slate-500">Hizmet tarihleri</dt>
                          <dd className="mt-1 font-semibold text-slate-800">
                            {formatCoveredDates(payment.coveredDates)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">Ödeme yöntemi</dt>
                          <dd className="mt-1 font-semibold text-slate-800">
                            {payment.cardLabel ?? "Öğün bakiyesi"}
                          </dd>
                        </div>
                      </dl>
                      {payment.status === "FAILED" && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
                          <span>{payment.failureMessage ?? "Ödeme alınamadı."}</span>
                          <button
                            onClick={() => retryPayment.mutate(payment.id)}
                            disabled={retryPayment.isPending}
                            className="rounded-lg bg-danger-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            Tekrar dene
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl bg-[#f7f7f7] p-4 text-sm text-slate-500">
                  Bu abonelik için henüz ödeme hareketi yok.
                </p>
              )}
              {["PENDING_APPROVAL", "APPROVED", "ACTIVE", "PAYMENT_SUSPENDED"].includes(
                sub.status,
              ) && (
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <label
                    htmlFor="subscription-payment-method"
                    className="text-sm font-bold text-slate-700"
                  >
                    Aboneliğin ödeme yöntemini değiştir
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <select
                      id="subscription-payment-method"
                      value={newPaymentMethodId ?? ""}
                      onChange={(event) =>
                        setNewPaymentMethodId(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      className="min-h-11 flex-1 rounded-2xl border border-[#e7e7e7] bg-white px-3 text-sm"
                    >
                      <option value="">Yeni kartı seçin</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.brand} •••• {method.lastFour} · {method.expiryMonth}/
                          {method.expiryYear}
                          {method.expiringSoon ? " · Süresi yakında dolacak" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!newPaymentMethodId || changePaymentMethod.isPending}
                      onClick={() =>
                        newPaymentMethodId &&
                        changePaymentMethod.mutate(newPaymentMethodId)
                      }
                      className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-40"
                    >
                      Kartı güncelle
                    </button>
                  </div>
                  <Link
                    to="/payment-methods"
                    className="mt-2 inline-block text-xs font-bold text-primary-700 underline"
                  >
                    Yeni kart ekle
                  </Link>
                </div>
              )}
              {paymentSummary.refunds.map((refund) => (
                <div
                  key={refund.id}
                  className="mt-3 flex justify-between rounded-xl border border-info-100 bg-info-50 p-3 text-sm text-info-700"
                >
                  <span>İade · {refund.status}</span>
                  <strong>
                    {refund.amount.toLocaleString("tr-TR")} {refund.currency}
                  </strong>
                </div>
              ))}
            </section>
          )}
          <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-2xl">
                {sub.storeLogoUrl ? (
                  <img
                    src={sub.storeLogoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "🍽️"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold">{sub.storeName}</h2>
                <p className="mt-1 text-slate-500">{sub.menuName}</p>
              </div>
              <Link
                to={`/subscribe?storeId=${sub.storeId}&menuId=${sub.menuId}&addressId=${sub.addressId}`}
                className="hidden items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary-300 hover:text-primary-600 sm:flex"
              >
                <RefreshCw className="h-4 w-4" /> Tekrar oluştur
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-5 text-sm sm:grid-cols-4">
              <div>
                <Users className="mb-2 h-5 w-5 text-primary-600" />
                <span className="block text-xs text-slate-500">
                  Kişi sayısı
                </span>
                <strong>{sub.personCount} kişi</strong>
              </div>
              <div>
                <CalendarDays className="mb-2 h-5 w-5 text-primary-600" />
                <span className="block text-xs text-slate-500">
                  Hizmet günü
                </span>
                <strong>{sub.serviceDayCount} gün</strong>
              </div>
              <div>
                <Clock3 className="mb-2 h-5 w-5 text-primary-600" />
                <span className="block text-xs text-slate-500">
                  Teslimat saati
                </span>
                <strong>{sub.deliveryTime}</strong>
              </div>
              <div>
                <span className="mb-2 block text-lg font-semibold text-primary-600">
                  ₺
                </span>
                <span className="block text-xs text-slate-500">Toplam</span>
                <strong>{sub.totalAmount.toLocaleString("tr-TR")} ₺</strong>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-2xl bg-[#f7f7f7] p-4 text-sm text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
              <span>
                <strong className="block text-slate-800">
                  {data.addressTitle || sub.addressTitle}
                </strong>
                {data.deliveryAddress ||
                  sub.deliveryAddress ||
                  "Adres bilgisi yok"}
              </span>
            </div>
            {sub.cancellationReason && (
              <div className="mt-4 flex gap-2 rounded-xl bg-danger-50 p-4 text-sm text-danger-700">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>
                  <strong>Neden:</strong> {sub.cancellationReason}
                </span>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#e7e7e7] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Teslimat takvimi</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(sub.startDate).toLocaleDateString("tr-TR")} –{" "}
                  {new Date(sub.endDate).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <Truck className="h-7 w-7 text-primary-600" />
            </div>
            {data.deliveries.length ? (
              <div className="mt-5 divide-y">
                {data.deliveries.map((delivery) => {
                  const request = deliveryChangeRequests.find(
                    (item) => item.deliveryId === delivery.id,
                  );
                  const requestState =
                    request?.status === "PENDING"
                      ? {
                          label: "Değişiklik onayı bekliyor",
                          color: "bg-warning-100 text-warning-700",
                        }
                      : request?.status === "REJECTED"
                        ? {
                            label: "Değişiklik reddedildi",
                            color: "bg-danger-100 text-danger-700",
                          }
                        : request
                          ? {
                              label: "Değişiklik onaylandı",
                              color: "bg-success-100 text-success-700",
                            }
                          : undefined;
                  return (
                    <div
                      key={delivery.id}
                      className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center ${delivery.status === "CANCELLED" ? "opacity-55" : ""}`}
                    >
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${delivery.status === "DELIVERED" ? "bg-success-100 text-success-600" : "bg-slate-100 text-slate-500"}`}
                      >
                        {delivery.status === "DELIVERED" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <CalendarDays className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <strong className="text-sm">
                          {new Date(delivery.deliveryDate).toLocaleDateString(
                            "tr-TR",
                            { weekday: "long", day: "numeric", month: "long" },
                          )}
                        </strong>
                        <p className="mt-1 text-xs text-slate-500">
                          {delivery.deliveryTime} · {delivery.menuName} ·{" "}
                          {delivery.personCount} kişi
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          domain="delivery"
                          status={delivery.status}
                        />
                        {requestState && (
                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${requestState.color}`}
                          >
                            {requestState.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                Onay sonrasında teslimat planınız burada görünecek.
              </p>
            )}
          </section>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-[#e7e7e7] bg-white p-5">
            <h2 className="font-semibold">Durum geçmişi</h2>
            <div className="mt-5 space-y-0">
              {timeline.map((item, index) => {
                const tone = {
                  pending: {
                    marker: "border-warning-500 bg-warning-100 text-warning-800",
                    connector: "bg-warning-300",
                    text: "text-warning-800",
                  },
                  approved: {
                    marker: "border-success-600 bg-success-600 text-white",
                    connector: "bg-success-300",
                    text: "text-slate-800",
                  },
                  rejected: {
                    marker: "border-danger-600 bg-danger-600 text-white",
                    connector: "bg-danger-300",
                    text: "text-danger-700",
                  },
                  neutral: {
                    marker: "border-slate-300 bg-white text-slate-400",
                    connector: "bg-slate-200",
                    text: "text-slate-500",
                  },
                }[item.tone];
                return (
                <div key={item.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full border-2 ${tone.marker}`}
                    >
                      {item.tone === "pending" ? (
                        <Clock3 className="h-3.5 w-3.5" />
                      ) : item.done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : null}
                    </span>
                    {index < timeline.length - 1 && (
                      <span
                        className={`min-h-12 w-0.5 flex-1 ${tone.connector}`}
                      />
                    )}
                  </div>
                  <div className="pb-5">
                    <p
                      className={`text-sm font-semibold ${tone.text}`}
                    >
                      {item.label}
                    </p>
                    {item.date && (
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(item.date).toLocaleString("tr-TR")}
                      </p>
                    )}
                    {item.detail && (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl border border-[#e7e7e7] bg-white p-5">
            <h2 className="font-semibold">İşlemler</h2>
            <div className="mt-4 space-y-2">
              {canReview && (
                <button
                  onClick={() => setShowReview(true)}
                  className="flex w-full items-center gap-2 rounded-xl bg-warning-50 px-4 py-3 text-left text-sm font-bold text-warning-700"
                >
                  <Star className="h-4 w-4" /> Deneyimini değerlendir
                </button>
              )}
              <button
                onClick={() => setShowComplaint(true)}
                className="flex w-full items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-bold text-slate-700"
              >
                <MessageSquareWarning className="h-4 w-4" /> Sorun bildir
              </button>
              {canCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="w-full rounded-xl bg-danger-50 px-4 py-3 text-left text-sm font-bold text-danger-600"
                >
                  Aboneliği iptal et
                </button>
              )}
              {["PENDING_APPROVAL", "APPROVED", "ACTIVE", "PAYMENT_SUSPENDED"].includes(
                sub.status,
              ) && (
                <button
                  type="button"
                  onClick={() => autoRenewMutation.mutate(!sub.autoRenew)}
                  disabled={autoRenewMutation.isPending}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold disabled:opacity-50 ${sub.autoRenew ? "bg-success-50 text-success-700" : "bg-slate-100 text-slate-700"}`}
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Otomatik yenileme
                  </span>
                  <span>{sub.autoRenew ? "Açık" : "Kapalı"}</span>
                </button>
              )}
              <Link
                to={`/subscribe?storeId=${sub.storeId}&menuId=${sub.menuId}&addressId=${sub.addressId}`}
                className="flex w-full items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold text-slate-700"
              >
                <RefreshCw className="h-4 w-4" /> Aynı menüyü tekrar seç
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {actionDelivery && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">Teslimat işlemi seçin</h2>
            <p className="mt-2 text-sm text-slate-500">
              {new Date(`${actionDelivery.deliveryDate}T12:00:00`).toLocaleDateString(
                "tr-TR",
                { day: "numeric", month: "long", year: "numeric" },
              )}{" "}
              tarihli teslimat için yapmak istediğiniz işlemi seçin. Her iki
              talep de satıcının onayına gönderilir.
            </p>
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => openModify(actionDelivery)}
                className="rounded-xl border border-info-200 p-4 text-left hover:bg-info-50"
              >
                <span className="flex items-center gap-2 font-semibold text-info-800">
                  <Clock3 className="h-5 w-5" /> Saat veya kişi sayısını değiştir
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  Teslimat saatini, kişi sayısını veya teslimat notunu güncelleyin.
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionDeliveryId(undefined);
                  setCancelDeliveryId(actionDelivery.id);
                }}
                className="rounded-xl border border-warning-200 p-4 text-left hover:bg-warning-50"
              >
                <span className="flex items-center gap-2 font-semibold text-warning-800">
                  <CalendarDays className="h-5 w-5" /> Yemek servisini iptal et
                </span>
                <span className="mt-1 block text-sm text-slate-500">
                  Satıcı onaylarsa yemek servisi iptal edilir ve ücret düzeltmesi yapılır.
                </span>
              </button>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setActionDeliveryId(undefined)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
      {modifyDeliveryId && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">Teslimat değişikliği talebi</h2>
            <p className="mt-2 text-sm text-slate-500">
              Yalnız bu teslimat günü için saat ve kişi sayısını
              değiştirebilirsiniz. Teslimat adresi abonelik boyunca sabittir.
              Talep satıcının onayına gönderilir.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="text-xs font-bold text-slate-600 sm:col-span-2">
                Teslimat adresi
                <div className="mt-1 flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-700">
                  <MapPin className="h-4 w-4 shrink-0 text-primary-600" />
                  <span>{modifyingDeliveryAddress || "Kayıtlı teslimat adresi"}</span>
                  <span className="ml-auto shrink-0 rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">
                    Değiştirilemez
                  </span>
                </div>
              </div>
              <label className="text-xs font-bold text-slate-600">
                Teslimat saati
                <select
                  aria-label="Teslimat saati"
                  value={modifyForm.deliveryTime}
                  onChange={(event) => {
                    setModifyForm({
                      ...modifyForm,
                      deliveryTime: event.target.value,
                    });
                    changePreview.reset();
                    applyChange.reset();
                  }}
                  className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                >
                  {modificationTimeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {modifyingDelivery && (
                  <span className="mt-1 block font-normal text-slate-500">
                    Mevcut: {toShortTime(modifyingDelivery.deliveryTime)} ·{" "}
                    15 dakikalık aralıklarla ±1 saat
                  </span>
                )}
              </label>
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                Teslimat notu
                <textarea
                  value={modifyForm.customerNote}
                  onChange={(event) => {
                    setModifyForm({
                      ...modifyForm,
                      customerNote: event.target.value,
                    });
                    changePreview.reset();
                    applyChange.reset();
                  }}
                  maxLength={500}
                  rows={3}
                  placeholder="Örn. Resepsiyona bırakın veya gelince arayın."
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal"
                />
                <span className="mt-1 block text-right font-normal text-slate-400">
                  {modifyForm.customerNote.length}/500
                </span>
              </label>
              <label className="text-xs font-bold text-slate-600">
                Kişi sayısı
                <select
                  aria-label="Kişi sayısı"
                  value={modifyForm.personCount}
                  onChange={(event) => {
                    setModifyForm({
                      ...modifyForm,
                      personCount: event.target.value,
                    });
                    changePreview.reset();
                    applyChange.reset();
                  }}
                  className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                >
                  {modificationPersonOptions.map((personCount) => (
                    <option key={personCount} value={personCount}>
                      {personCount}
                    </option>
                  ))}
                </select>
                {modifyingDelivery && modificationPersonBounds && (
                  <span className="mt-1 block font-normal text-slate-500">
                    Mevcut: {modifyingDelivery.personCount} kişi ·{" "}
                    {modificationPersonBounds.min} – {modificationPersonBounds.max} kişi
                  </span>
                )}
              </label>
            </div>
            {changePreview.data && (
              <div className="mt-4 rounded-xl bg-info-50 p-4 text-sm text-info-800">
                <div className="flex justify-between">
                  <span>Eski günlük tutar</span>
                  <strong>
                    {changePreview.data.oldDailyAmount.toLocaleString("tr-TR")}{" "}
                    ₺
                  </strong>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Talep sonrası günlük tutar</span>
                  <strong>
                    {changePreview.data.newDailyAmount.toLocaleString("tr-TR")}{" "}
                    ₺
                  </strong>
                </div>
                <div className="mt-2 border-t border-info-200 pt-2">
                  Satıcı onaylarsa fiyat farkı otomatik tahsil edilir veya iade
                  edilir.
                </div>
              </div>
            )}
            {(changePreview.isError || applyChange.isError) && (
              <div className="mt-4 rounded-xl border border-danger-100 bg-danger-50 p-3 text-sm font-semibold text-danger-700">
                {deliveryChangeError ||
                  deliveryPreviewError ||
                  "Değişiklik talebi gönderilemedi. Teslimat saati, kişi sayısı ve değişiklik süresini kontrol edin."}
              </div>
            )}
            {!hasDeliveryChange && (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Talep göndermek için teslimat saati, kişi sayısı veya notu değiştirin.
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setModifyDeliveryId(undefined)}
                className="rounded-xl px-4 py-2 text-sm font-bold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => changePreview.mutate()}
                disabled={changePreview.isPending || !hasDeliveryChange}
                className="rounded-xl border border-info-300 px-4 py-2 text-sm font-bold text-info-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Önizle
              </button>
              <button
                type="button"
                onClick={() => applyChange.mutate()}
                disabled={applyChange.isPending || !hasDeliveryChange}
                className="rounded-xl bg-info-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applyChange.isPending ? "Gönderiliyor…" : "Talep gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={!!cancelDeliveryId}
        title="Yemek servisi iptal talebi gönder"
        message="Talep satıcının onayına gönderilecek. Satıcı onaylayana kadar teslimat planlı kalacak; onaydan sonra yemek servisi iptal edilip uygun ücret düzeltmesi oluşturulacak."
        confirmLabel="Onaya gönder"
        pending={cancelDelivery.isPending}
        onClose={() => setCancelDeliveryId(undefined)}
        onConfirm={() => cancelDeliveryId && cancelDelivery.mutate(cancelDeliveryId)}
      />
      {showFreeze && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">Aboneliği dondur</h2>
            <p className="mt-2 text-sm text-slate-500">
              Aralıktaki planlanmış teslimatlar atlanır ve ücret düzeltmesi
              yapılır.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-600">
                Başlangıç
                <input
                  type="date"
                  value={freezeForm.startDate}
                  onChange={(event) =>
                    setFreezeForm({
                      ...freezeForm,
                      startDate: event.target.value,
                    })
                  }
                  className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-slate-600">
                Bitiş
                <input
                  type="date"
                  min={freezeForm.startDate}
                  value={freezeForm.endDate}
                  onChange={(event) =>
                    setFreezeForm({
                      ...freezeForm,
                      endDate: event.target.value,
                    })
                  }
                  className="mt-1 h-11 w-full rounded-xl border px-3 text-sm font-normal"
                />
              </label>
            </div>
            <textarea
              value={freezeForm.reason}
              onChange={(event) =>
                setFreezeForm({ ...freezeForm, reason: event.target.value })
              }
              rows={3}
              placeholder="Dondurma nedeni (isteğe bağlı)"
              className="mt-3 w-full rounded-xl border p-3 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowFreeze(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold"
              >
                Vazgeç
              </button>
              <button
                onClick={() => freezeSubscription.mutate()}
                disabled={
                  !freezeForm.startDate ||
                  !freezeForm.endDate ||
                  freezeSubscription.isPending
                }
                className="rounded-xl bg-info-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Dondur
              </button>
            </div>
          </div>
        </div>
      )}

      {showExtend && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="extend-subscription-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 id="extend-subscription-title" className="text-xl font-bold">
              Abonelik dönemini uzat
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Mevcut menü, kişi sayısı, adres ve teslimat saati korunur. Yeni
              hizmet günleri satıcı onayından sonra haftalık ödeme planına eklenir.
            </p>
            <label className="mt-5 block text-sm font-bold text-slate-700">
              Yeni bitiş tarihi
              <input
                type="date"
                min={new Date(
                  new Date(`${sub.endDate}T12:00:00`).getTime() + 86_400_000,
                )
                  .toISOString()
                  .slice(0, 10)}
                value={extensionEndDate}
                onChange={(event) => setExtensionEndDate(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExtend(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => extendSubscription.mutate()}
                disabled={!extensionEndDate || extendSubscription.isPending}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Onaya gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">Aboneliği iptal et</h2>
            <p className="mt-2 text-sm text-slate-500">
              İptal nedeninizi belirtmeniz satıcıya yardımcı olur.
            </p>
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={3}
              placeholder="İptal nedeni"
              className="mt-4 w-full rounded-xl border p-3 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCancel(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold"
              >
                Vazgeç
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="rounded-xl bg-danger-600 px-4 py-2 text-sm font-bold text-white"
              >
                İptal et
              </button>
            </div>
          </div>
        </div>
      )}
      {showReview && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">Deneyiminizi değerlendirin</h2>
            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={`text-3xl ${value <= rating ? "text-warning-400" : "text-slate-200"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="Yemekler ve hizmet nasıldı?"
              className="mt-5 w-full rounded-xl border p-3 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowReview(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold"
              >
                Vazgeç
              </button>
              <button
                onClick={() => reviewMutation.mutate()}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white"
              >
                Yayınla
              </button>
            </div>
          </div>
        </div>
      )}
      {showComplaint && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">Sorun bildir</h2>
            <select
              aria-label="Sorunun ilgili olduğu teslimat"
              value={complaint.deliveryId}
              onChange={(event) =>
                setComplaint({ ...complaint, deliveryId: event.target.value })
              }
              className="mt-5 h-11 w-full rounded-xl border px-3 text-sm"
            >
              <option value="">Genel abonelik sorunu</option>
              {data.deliveries.map((delivery) => (
                <option key={delivery.id} value={delivery.id}>
                  {new Date(delivery.deliveryDate).toLocaleDateString("tr-TR")}{" "}
                  teslimatı
                </option>
              ))}
            </select>
            <input
              aria-label="Sorun başlığı"
              value={complaint.reason}
              onChange={(event) =>
                setComplaint({ ...complaint, reason: event.target.value })
              }
              placeholder="Sorun başlığı"
              className="mt-3 h-11 w-full rounded-xl border px-3 text-sm"
            />
            <textarea
              aria-label="Sorun açıklaması"
              value={complaint.description}
              onChange={(event) =>
                setComplaint({ ...complaint, description: event.target.value })
              }
              rows={4}
              placeholder="Sorunu ayrıntılı anlatın"
              className="mt-3 w-full rounded-xl border p-3 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowComplaint(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold"
              >
                Vazgeç
              </button>
              <button
                onClick={() => complaintMutation.mutate()}
                disabled={!complaint.reason || !complaint.description}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Talep oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
