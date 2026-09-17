import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import type { SubscriptionStatus } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";

function apiError(error: unknown) {
  return (
    (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message || "İşlem tamamlanamadı."
  );
}

export default function SellerSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<SubscriptionStatus | undefined>(
    "PENDING_APPROVAL",
  );
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["seller-subscriptions", tab],
    queryFn: () => sellerService.getSubscriptions(tab),
  });
  const { data: rejectionReasons = [] } = useQuery({
    queryKey: ["seller-rejection-reasons"],
    queryFn: sellerService.getRejectionReasons,
  });

  const approveMutation = useMutation({
    mutationFn: sellerService.approveSubscription,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["seller-subscriptions"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      sellerService.rejectSubscription(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-subscriptions"] });
      setRejectId(null);
      setRejectReason("");
    },
  });

  const tabs: { label: string; value: SubscriptionStatus | undefined }[] = [
    { label: "Onay Bekleyen", value: "PENDING_APPROVAL" },
    { label: "Müşteri Ödemesi", value: "PAYMENT_PENDING" },
    { label: "Onaylanan", value: "APPROVED" },
    { label: "Aktif", value: "ACTIVE" },
    { label: "Ödeme bekleyen", value: "PAYMENT_SUSPENDED" },
    { label: "Tümü", value: undefined },
  ];

  return (
    <div className="mf-page">
      <div className="border-b border-[#e6e1d8] pb-5">
        <p className="customer-eyebrow">Talep yönetimi</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Abonelikler</h1>
        <p className="mt-1 text-sm text-slate-500">Yeni talepleri değerlendirin ve aktif anlaşmaları durumlarına göre izleyin.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#e6e1d8]">
        {tabs.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.value)}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
              tab === t.value
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-slate-500 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : data?.content.length === 0 ? (
        <div className="mf-surface p-12 text-center text-slate-500">
          Abonelik bulunamadı.
        </div>
      ) : (
        <div className="space-y-4">
          {data?.content.map((sub) => {
            return (
              <div key={sub.id} className="mf-surface p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">#{sub.id}</p>
                    <h3 className="font-semibold text-slate-900">
                      {sub.menuName}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {sub.personCount} kişi · {sub.deliveryTime} ·{" "}
                      {sub.startDate} → {sub.endDate}
                    </p>
                    <p className="text-sm font-semibold text-primary-600 mt-1">
                      {sub.totalAmount.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                  <StatusBadge domain="subscription" status={sub.status} />
                </div>

                {sub.status === "PENDING_APPROVAL" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate(sub.id)}
                      disabled={approveMutation.isPending}
                      className="bg-success-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-success-700 disabled:opacity-50"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => setRejectId(sub.id)}
                      className="bg-danger-50 text-danger-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-danger-100"
                    >
                      Reddet
                    </button>
                  </div>
                )}

                {rejectId === sub.id && (
                  <div className="mt-3">
                    <div className="flex gap-2">
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      aria-label="Abonelik ret nedeni"
                      className="mf-input flex-1"
                    >
                      <option value="">Ret nedeni seçin</option>
                      {rejectionReasons.map((reason) => (
                        <option key={reason.code} value={reason.code}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        rejectMutation.mutate({
                          id: sub.id,
                          reason: rejectReason,
                        })
                      }
                      disabled={!rejectReason || rejectMutation.isPending}
                      className="bg-danger-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Gönder
                    </button>
                    <button
                      onClick={() => {
                        setRejectId(null);
                        setRejectReason("");
                      }}
                      className="text-slate-500 px-3 text-sm"
                    >
                      İptal
                    </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Seçilen açıklama müşteriye gösterilir.
                    </p>
                    {rejectMutation.isError && (
                      <p role="alert" className="mt-2 text-sm font-semibold text-danger-700">
                        {apiError(rejectMutation.error)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
