import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  RefreshCw,
  Users,
} from "lucide-react";
import { subscriptionService } from "@/services/subscriptionService";
import type { Subscription, SubscriptionStatus } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import MediaPlaceholder from "@/components/brand/MediaPlaceholder";
import QueryBoundary from "@/components/ui/QueryBoundary";

type Tab = "all" | "pending" | "ongoing" | "completed" | "closed";
const tabs: { value: Tab; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "pending", label: "Onay bekleyen" },
  { value: "ongoing", label: "Devam eden" },
  { value: "completed", label: "Tamamlanan" },
  { value: "closed", label: "İptal / Ret" },
];
const groups: Record<Tab, SubscriptionStatus[]> = {
  all: [
    "PENDING_APPROVAL",
    "PAYMENT_PENDING",
    "APPROVED",
    "ACTIVE",
    "PAYMENT_SUSPENDED",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
  ],
  pending: ["PENDING_APPROVAL"],
  ongoing: ["PAYMENT_PENDING", "APPROVED", "ACTIVE", "PAYMENT_SUSPENDED"],
  completed: ["COMPLETED"],
  closed: ["REJECTED", "CANCELLED"],
};

function SubscriptionCard({ item }: { item: Subscription }) {
  return (
    <article className="mf-surface group p-5 transition hover:-translate-y-0.5 hover:shadow-floating sm:p-6">
      <Link to={`/subscriptions/${item.id}`} className="block">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
            <MediaPlaceholder
              src={item.storeLogoUrl}
              alt={`${item.storeName} logosu`}
              kind="store"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-black text-ink transition group-hover:text-primary-600">
                  {item.storeName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{item.menuName}</p>
              </div>
              <StatusBadge domain="subscription" status={item.status} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-xs text-slate-500 sm:grid-cols-4">
              <span>
                <Users className="mb-1 h-4 w-4 text-slate-500" />
                <strong className="block text-slate-800">
                  {item.personCount} kişi
                </strong>
              </span>
              <span>
                <CalendarDays className="mb-1 h-4 w-4 text-slate-500" />
                <strong className="block text-slate-800">
                  {item.serviceDayCount} hizmet günü
                </strong>
              </span>
              <span>
                <Clock3 className="mb-1 h-4 w-4 text-slate-500" />
                <strong className="block text-slate-800">
                  {item.nextDeliveryDate
                    ? new Date(item.nextDeliveryDate).toLocaleDateString(
                        "tr-TR",
                      )
                    : item.deliveryTime}
                </strong>
              </span>
              <span>
                <span className="mb-1 block text-slate-500">Toplam</span>
                <strong className="text-base text-primary-600">
                  {item.totalAmount.toLocaleString("tr-TR")} ₺
                </strong>
              </span>
            </div>
          </div>
          <ArrowRight className="mt-4 hidden h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-primary-600 sm:block" />
        </div>
      </Link>
      {item.status === "COMPLETED" && (
        <Link
          to={`/subscribe?storeId=${item.storeId}&menuId=${item.menuId}&addressId=${item.addressId}&renewFrom=${item.id}`}
          className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm font-bold text-primary-700 hover:bg-primary-100"
        >
          <RefreshCw className="h-4 w-4" />
          Aboneliği yenile
        </Link>
      )}
    </article>
  );
}

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(0);
  const statuses = groups[tab];
  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions", "customer", tab, page],
    queryFn: () =>
      subscriptionService.getMySubscriptions(undefined, page, 10, statuses),
  });
  const data = subscriptionsQuery.data;
  const selectTab = (value: Tab) => {
    setTab(value);
    setPage(0);
  };

  return (
    <div className="mf-page">
      <PageHeader
        eyebrow="Hesabım"
        title="Aboneliklerim"
        description="Taleplerinizi, teslimat planınızı ve tamamlanan aboneliklerinizi buradan takip edin."
        actions={
          <Link to="/stores">
            <Button leftIcon={<ArrowRight className="h-4 w-4" />}>
              İşletmeleri keşfet
            </Button>
          </Link>
        }
      />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
        {tabs.map((item) => (
          <button
            key={item.value}
            onClick={() => selectTab(item.value)}
            className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${tab === item.value ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        <QueryBoundary
          query={subscriptionsQuery}
          loadingFallback={
            <>
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </>
          }
          errorTitle="Abonelikleriniz yüklenemedi"
          errorDescription="Abonelik kayıtlarınız silinmedi. Bağlantınızı kontrol edip tekrar deneyin."
          isEmpty={(result) => !result.content.length}
          emptyTitle={
            tab === "pending"
              ? "Onay bekleyen aboneliğiniz bulunmuyor"
              : "Bu bölümde abonelik bulunmuyor"
          }
          emptyDescription="Adresinize hizmet veren işletmeleri inceleyerek yeni abonelik talebi oluşturabilirsiniz."
          emptyAction={
            <Link to="/stores">
              <Button>İşletmeleri keşfet</Button>
            </Link>
          }
        >
          {(result) => result.content.map((item) => (
            <SubscriptionCard key={item.id} item={item} />
          ))}
        </QueryBoundary>
      </div>
      {!!data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={data.first}
            onClick={() => setPage((value) => value - 1)}
          >
            Önceki
          </Button>
          <span className="text-sm font-bold text-slate-500">
            {data.number + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.last}
            onClick={() => setPage((value) => value + 1)}
          >
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}
