import { useQuery } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import type { SubscriptionStatus } from "@/types";
import { Link, useOutletContext } from "react-router-dom";
import { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";

export default function StoreSubscriptionsPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const [tab, setTab] =
    useState<Extract<SubscriptionStatus, "PAYMENT_PENDING" | "APPROVED" | "ACTIVE" | "PAYMENT_SUSPENDED">>(
      "ACTIVE",
    );
  const { data, isLoading } = useQuery({
    queryKey: ["seller-subscriptions", storeId, tab],
    queryFn: () => sellerService.getSubscriptionsForStore(storeId, tab),
    enabled: !!storeId,
  });

  const tabs: { value: typeof tab; label: string }[] = [
    { value: "PAYMENT_PENDING", label: "Müşteri Ödemesi" },
    { value: "APPROVED", label: "Başlamayı Bekleyen" },
    { value: "ACTIVE", label: "Aktif" },
    { value: "PAYMENT_SUSPENDED", label: "Ödeme Bekleyen" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#e6e1d8] pb-5">
        <p className="customer-eyebrow">Müşteri anlaşmaları</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">Anlaşmalı abonelikler</h2>
        <p className="mt-1 text-sm text-slate-500">Ödeme ve başlangıç durumuna göre devam eden anlaşmaları izleyin.</p>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-[#e6e1d8]">
        {tabs.map((item) => (
          <button
            key={item.value}
            onClick={() => setTab(item.value)}
            className={`border-b-2 px-3 py-3 text-sm font-semibold ${tab === item.value ? "border-primary-600 text-primary-700" : "border-transparent text-slate-500 hover:text-ink"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : !data?.content.length ? (
        <div className="mf-surface p-12 text-center text-slate-500">
          Bu grupta abonelik bulunmuyor.
        </div>
      ) : (
        <div className="space-y-4">
          {data.content.map((sub) => {
            return (
              <div key={sub.id} className="mf-surface p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">#{sub.id}</p>
                    <h3 className="font-semibold text-slate-900">
                      {sub.menuName}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {sub.personCount} kişi · {sub.deliveryTime}
                    </p>
                    <p className="text-sm text-slate-500">
                      {sub.startDate} → {sub.endDate}
                    </p>
                    <p className="text-sm font-semibold text-primary-600 mt-1">
                      {sub.totalAmount.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                  <StatusBadge domain="subscription" status={sub.status} />
                </div>
                <Link
                  to={`/seller/stores/${storeId}/subscriptions/${sub.id}`}
                  className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline"
                >
                  Abonelik Detayı →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
