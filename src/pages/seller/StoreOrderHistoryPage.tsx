import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import { downloadCsv } from "@/utils/csv";
import StatusBadge from "@/components/ui/StatusBadge";
import { deliveryStatuses, uiStatus } from "@/constants/statuses";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function StoreOrderHistoryPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(formatDate(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["delivery-stats", storeId, startDate, endDate],
    queryFn: () => sellerService.getDeliveryStats(storeId, startDate, endDate),
    enabled: !!storeId,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "order-history",
      storeId,
      startDate,
      endDate,
      statusFilter,
      page,
    ],
    queryFn: () =>
      sellerService.getOrderHistory(
        storeId,
        startDate,
        endDate,
        statusFilter || undefined,
        page,
      ),
    enabled: !!storeId,
  });

  const exportCsv = async () => {
    setIsExporting(true);
    try {
      const result = await sellerService.getOrderHistory(
        storeId,
        startDate,
        endDate,
        statusFilter || undefined,
        0,
        10000,
      );
      downloadCsv(
        `siparis-gecmisi-${startDate}-${endDate}.csv`,
        ["Tarih", "Saat", "Müşteri", "Menü", "Kişi", "Adres", "Durum", "Not"],
        result.content.map((item) => [
          item.deliveryDate,
          item.deliveryTime,
          item.customerName,
          item.menuName,
          item.personCount,
          item.deliveryAddress,
          uiStatus(deliveryStatuses, item.status).label,
          item.notes || "",
        ]),
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e7e7e7] pb-5">
        <div>
          <p className="customer-eyebrow">Operasyon arşivi</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">Sipariş geçmişi</h2>
          <p className="mt-1 text-sm text-slate-500">Geçmiş teslimatları filtreleyin, inceleyin ve dışa aktarın.</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={
            isExporting || !startDate || !endDate || startDate > endDate
          }
          className="rounded-xl border border-[#e7e7e7] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {isExporting ? "Hazırlanıyor..." : "CSV İndir"}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="mf-surface p-4 text-center">
            <p className="text-sm text-slate-500">Teslim Edilen</p>
            <p className="text-2xl font-bold text-success-600">
              {stats.delivered}
            </p>
          </div>
          <div className="mf-surface p-4 text-center">
            <p className="text-sm text-slate-500">İptal</p>
            <p className="text-2xl font-bold text-danger-600">
              {stats.cancelled}
            </p>
          </div>
          <div className="mf-surface p-4 text-center">
            <p className="text-sm text-slate-500">Bekleyen</p>
            <p className="text-2xl font-bold text-warning-600">
              {stats.scheduled}
            </p>
          </div>
          <div className="mf-surface p-4 text-center">
            <p className="text-sm text-slate-500">Toplam Porsiyon</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.totalPersons}
            </p>
          </div>
        </div>
      )}

      <div className="mf-surface p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Başlangıç
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="px-3 py-1.5 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Bitiş</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="px-3 py-1.5 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="">Tümü</option>
              <option value="SCHEDULED">Bekliyor</option>
              <option value="IN_TRANSIT">Yolda</option>
              <option value="DELIVERED">Teslim Edildi</option>
              <option value="CANCELLED">İptal</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : !data?.content.length ? (
        <div className="mf-surface p-12 text-center text-slate-500">
          Seçilen tarih aralığında sipariş bulunamadı.
        </div>
      ) : (
        <>
          <div className="mf-surface divide-y">
            {data.content.map((d) => {
              return (
                <div
                  key={d.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-medium text-slate-900">
                        {d.deliveryDate}
                      </span>
                      <span className="text-sm text-slate-500">
                        {d.deliveryTime}
                      </span>
                      <StatusBadge domain="delivery" status={d.status} />
                    </div>
                    <p className="font-medium text-slate-700">
                      {d.customerName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {d.menuName} · {d.personCount} kişi
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
              >
                Önceki
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-600">
                {page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
