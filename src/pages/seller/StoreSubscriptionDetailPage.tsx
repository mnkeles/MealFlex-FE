import { Link, useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { sellerService } from "@/services/sellerService";
import StatusBadge from "@/components/ui/StatusBadge";

const eventLabels: Record<string, string> = {
  SUBSCRIPTION_APPROVED: "Abonelik onaylandı",
  SUBSCRIPTION_REJECTED: "Talep reddedildi",
  SUBSCRIPTION_CANCELLED: "Müşteri aboneliği iptal etti",
  SUBSCRIPTION_CANCELLED_BY_SELLER: "İşletme aboneliği iptal etti",
  SUBSCRIPTION_POSTPONED: "Onay süresi dolduğu için tarihler ertelendi",
  SUBSCRIPTION_AUTO_CANCELLED: "Onay süresi dolduğu için talep iptal edildi",
  SUBSCRIPTION_ACTIVATED: "Abonelik başladı",
  SUBSCRIPTION_COMPLETED: "Abonelik tamamlandı",
};

function postponedDateChange(oldValue?: string, newValue?: string) {
  if (!oldValue || !newValue) return undefined;
  const oldParts = oldValue.split("/");
  const newParts = newValue.split("/");
  if (oldParts.length < 2 || newParts.length < 2) return undefined;
  const format = (value: string) => new Date(value).toLocaleDateString("tr-TR");
  return `${format(oldParts[0])} – ${format(oldParts[1])} → ${format(newParts[0])} – ${format(newParts[1])}`;
}

export default function StoreSubscriptionDetailPage() {
  const queryClient = useQueryClient();
  const { storeId } = useOutletContext<{ storeId: number }>();
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const id = Number(subscriptionId);
  const [activeTab, setActiveTab] = useState<
    "summary" | "deliveries" | "history" | "contact"
  >("summary");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReasonCode, setCancelReasonCode] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["seller-subscription-detail", id],
    queryFn: () => sellerService.getSellerSubscriptionDetail(id),
    enabled: Number.isFinite(id),
  });
  const { data: events = [] } = useQuery({
    queryKey: ["seller-subscription-events", id],
    queryFn: () => sellerService.getSubscriptionEvents(id),
    enabled: Number.isFinite(id),
  });
  const cancelMutation = useMutation({
    mutationFn: () => sellerService.cancelSubscription(id, cancelReasonCode),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["seller-subscription-detail", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["seller-subscription-events", id],
      });
      queryClient.invalidateQueries({ queryKey: ["seller-subscriptions"] });
      setCancelDialogOpen(false);
      setCancelReasonCode("");
    },
  });
  const { data: cancellationReasons = [] } = useQuery({
    queryKey: ["seller-rejection-reasons"],
    queryFn: sellerService.getRejectionReasons,
  });

  if (isLoading)
    return (
      <div className="py-12 text-center text-slate-500">Yükleniyor...</div>
    );
  if (!data)
    return (
      <div className="py-12 text-center text-slate-500">
        Abonelik bulunamadı.
      </div>
    );
  const sub = data.subscription;
  const selectTab = (tab: typeof activeTab) => setActiveTab(tab);

  return (
    <div className="space-y-6">
      <Link
        to={`/seller/stores/${storeId}/subscriptions`}
        className="text-sm text-primary-600 hover:underline"
      >
        ← Aboneliklere dön
      </Link>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Abonelik #{sub.id}</h2>
        <div className="flex items-center gap-3">
          <StatusBadge domain="subscription" status={sub.status} />
          {["APPROVED", "ACTIVE", "PAYMENT_SUSPENDED"].includes(
            sub.status,
          ) && (
            <button
              type="button"
              onClick={() => {
                cancelMutation.reset();
                setCancelReasonCode("");
                setCancelDialogOpen(true);
              }}
              className="rounded-lg border border-danger-200 px-3 py-2 text-sm font-bold text-danger-700 hover:bg-danger-50"
            >
              Aboneliği iptal et
            </button>
          )}
        </div>
      </div>
      <div
        role="tablist"
        aria-label="Abonelik ayrıntı bölümleri"
        className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2"
      >
        {(
          [
            { value: "summary", label: "Özet ve ödeme" },
            { value: "deliveries", label: "Teslimatlar" },
            { value: "history", label: "Durum geçmişi" },
            { value: "contact", label: "İletişim" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => selectTab(tab.value)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${activeTab === tab.value ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "summary" && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold">Ödeme ve Abonelik Özeti</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Menü</dt>
              <dd>{sub.menuName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Kişi</dt>
              <dd>{sub.personCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Hizmet günü</dt>
              <dd>{sub.serviceDayCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Birim fiyat</dt>
              <dd>{sub.pricePerPerson.toLocaleString("tr-TR")} ₺</dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <dt>Toplam</dt>
              <dd className="text-primary-600">
                {sub.totalAmount.toLocaleString("tr-TR")} ₺
              </dd>
            </div>
          </dl>
        </section>
      )}
      {activeTab === "contact" && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold">Müşteri Bilgileri</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500">Ad Soyad</dt>
              <dd className="font-medium">{data.customerName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">E-posta</dt>
              <dd className="font-medium">{data.customerEmail}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Telefon</dt>
              <dd className="font-medium">{data.customerPhone || "-"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Teslimat Adresi</dt>
              <dd className="font-medium">{data.deliveryAddress}</dd>
            </div>
          </dl>
        </section>
      )}
      {activeTab === "history" && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold">Durum Geçmişi</h3>
        <div className="space-y-4 border-l-2 border-slate-100 pl-5">
          <div className="relative text-sm">
            <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full bg-primary-500 ring-4 ring-white" />
            <p className="font-medium">Talep oluşturuldu</p>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(sub.createdAt).toLocaleString("tr-TR")}
            </p>
          </div>
          {events.map((event) => {
            const failed = [
              "SUBSCRIPTION_REJECTED",
              "SUBSCRIPTION_CANCELLED",
              "SUBSCRIPTION_AUTO_CANCELLED",
            ].includes(event.action);
            const detail =
              event.action === "SUBSCRIPTION_POSTPONED"
                ? postponedDateChange(event.oldValue, event.newValue)
                : undefined;
            return (
              <div key={event.id} className="relative text-sm">
                <span
                  className={`absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full ring-4 ring-white ${failed ? "bg-danger-500" : "bg-success-500"}`}
                />
                <p className="font-medium">
                  {eventLabels[event.action] || event.action}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(event.timestamp).toLocaleString("tr-TR")}
                </p>
                {detail && (
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {detail}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        </section>
      )}
      {activeTab === "deliveries" && (
        <section className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold">
          Teslimat Geçmişi ({data.deliveries.length})
        </h3>
        {!data.deliveries.length ? (
          <p className="text-sm text-slate-500">Teslimat bulunmuyor.</p>
        ) : (
          <div className="divide-y">
            {data.deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className={`flex items-center justify-between py-3 text-sm ${delivery.status === "CANCELLED" ? "opacity-55" : ""}`}
              >
                <div>
                  <span className="font-medium">{delivery.deliveryDate}</span>
                  <span className="ml-3 text-slate-500">
                    {delivery.deliveryTime}
                  </span>
                </div>
                <StatusBadge domain="delivery" status={delivery.status} />
              </div>
            ))}
          </div>
        )}
        </section>
      )}
      {cancelDialogOpen && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-cancel-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-floating">
            <h3 id="seller-cancel-title" className="text-xl font-semibold">
              Aboneliği iptal et
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Gelecek teslimatlar iptal edilir, tahsil edilmiş kullanılmayan
              hizmetler otomatik iade edilir ve işlem satıcı performans kaydına
              eklenir. Bu işlem geri alınamaz.
            </p>
            <label className="mt-5 block text-sm font-bold text-slate-700">
              Müşteriye iletilecek iptal gerekçesi
              <select
                autoFocus
                value={cancelReasonCode}
                onChange={(event) => setCancelReasonCode(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
              >
                <option value="">Bir gerekçe seçin</option>
                {cancellationReasons.map((reason) => (
                  <option key={reason.code} value={reason.code}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>
            {cancelMutation.isError && (
              <p className="mt-3 text-sm font-semibold text-danger-700">
                {(cancelMutation.error as { response?: { data?: { message?: string } } })
                  .response?.data?.message || "Abonelik iptal edilemedi."}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelDialogOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={!cancelReasonCode || cancelMutation.isPending}
                className="rounded-xl bg-danger-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                İptal ve iadeyi başlat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
