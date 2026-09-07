import { useQuery } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import type { SubscriptionStatus } from "@/types";
import { Link, useOutletContext } from "react-router-dom";
import { useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";

export default function StoreSubscriptionsPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const [tab, setTab] =
    useState<Extract<SubscriptionStatus, "APPROVED" | "ACTIVE" | "PAYMENT_SUSPENDED">>(
      "ACTIVE",
    );
  const { data, isLoading } = useQuery({
    queryKey: ["seller-subscriptions", storeId, tab],
    queryFn: () => sellerService.getSubscriptionsForStore(storeId, tab),
    enabled: !!storeId,
  });

  const tabs: { value: typeof tab; label: string }[] = [
    { value: "APPROVED", label: "Başlamayı Bekleyen" },
    { value: "ACTIVE", label: "Aktif" },
    { value: "PAYMENT_SUSPENDED", label: "Ödeme Bekleyen" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Anlaşmalı Abonelikler</h2>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.value}
            onClick={() => setTab(item.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === item.value ? "bg-primary-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : !data?.content.length ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-slate-500">
          Bu grupta abonelik bulunmuyor.
        </div>
      ) : (
        <div className="space-y-4">
          {data.content.map((sub) => {
            return (
              <div key={sub.id} className="bg-white rounded-xl shadow-sm p-5">
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
