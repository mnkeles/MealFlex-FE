import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function StoreAnalyticsPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(today.getDate() - 29);
  const [startDate, setStartDate] = useState(formatDate(monthAgo));
  const [endDate, setEndDate] = useState(formatDate(today));

  const { data, isLoading } = useQuery({
    queryKey: ["store-analytics", storeId, startDate, endDate],
    queryFn: () => sellerService.getStoreAnalytics(storeId, startDate, endDate),
    enabled: !!storeId && !!startDate && !!endDate && startDate <= endDate,
  });

  const maxPersons = Math.max(
    1,
    ...(data?.deliveryTrend.map((item) => item.personCount) ?? []),
  );
  const maxRatingCount = Math.max(
    1,
    ...Object.values(data?.ratingDistribution ?? {}),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e7e7e7] pb-5">
        <div>
          <p className="customer-eyebrow">Performans</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">Analitik</h2>
          <p className="text-sm text-slate-500">
            Teslim edilen siparişler ve müşteri değerlendirmeleri
          </p>
        </div>
        <div className="flex gap-3">
          <label className="text-xs text-slate-500">
            Başlangıç
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mf-input mt-1 h-10"
            />
          </label>
          <label className="text-xs text-slate-500">
            Bitiş
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="mf-input mt-1 h-10"
            />
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : (
        data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mf-surface p-5">
                <p className="text-sm text-slate-500">Ortalama Puan</p>
                <p className="text-3xl font-bold text-warning-500 mt-1">
                  {Number(data.rating).toFixed(1)} / 5
                </p>
              </div>
              <div className="mf-surface p-5">
                <p className="text-sm text-slate-500">Toplam Yorum</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {data.reviewCount}
                </p>
              </div>
            </div>

            <section className="mf-surface p-5">
              <h3 className="font-semibold mb-4">Günlük Teslimat Porsiyonu</h3>
              {!data.deliveryTrend.length ? (
                <p className="text-sm text-slate-500">
                  Bu dönemde teslimat bulunmuyor.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.deliveryTrend.map((item) => (
                    <div
                      key={item.date}
                      className="grid grid-cols-[90px_1fr_90px] items-center gap-3 text-sm"
                    >
                      <span className="text-slate-500">
                        {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                          "tr-TR",
                        )}
                      </span>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{
                            width: `${(item.personCount / maxPersons) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-right text-slate-700">
                        {item.personCount} kişi
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="mf-surface p-5">
                <h3 className="font-semibold mb-4">Popüler Menüler</h3>
                {!data.popularMenus.length ? (
                  <p className="text-sm text-slate-500">Veri bulunmuyor.</p>
                ) : (
                  <div className="divide-y">
                    {data.popularMenus.map((menu, index) => (
                      <div
                        key={menu.menuId}
                        className="py-3 flex justify-between gap-4 text-sm"
                      >
                        <span>
                          <strong className="text-primary-600 mr-2">
                            #{index + 1}
                          </strong>
                          {menu.menuName}
                        </span>
                        <span className="text-slate-500">
                          {menu.personCount} kişi · {menu.deliveryCount}{" "}
                          teslimat
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mf-surface p-5">
                <h3 className="font-semibold mb-4">Puan Dağılımı</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = data.ratingDistribution[String(rating)] ?? 0;
                    return (
                      <div
                        key={rating}
                        className="grid grid-cols-[42px_1fr_35px] items-center gap-3 text-sm"
                      >
                        <span className="text-warning-500">{rating} ★</span>
                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-warning-400"
                            style={{
                              width: `${(count / maxRatingCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-right text-slate-500">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )
      )}
    </div>
  );
}
