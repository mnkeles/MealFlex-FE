import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { paymentService } from "@/services/paymentService";
import { downloadCsv } from "@/utils/csv";
import StatusBadge from "@/components/ui/StatusBadge";
import { paymentStatuses, uiStatus } from "@/constants/statuses";

const formatDate = (date: Date) => date.toISOString().split("T")[0];
const money = (value: number) =>
  `${Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`;
const sellerPaymentStatus = (value: string) => {
  if (value === "PARTIALLY_REFUNDED")
    return { label: "Hakediş güncellendi", tone: "info" as const };
  if (value === "REFUNDED")
    return { label: "Hakediş oluşmadı", tone: "neutral" as const };
  return uiStatus(paymentStatuses, value);
};

export default function StoreFinancePage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(formatDate(firstOfMonth));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["store-finance-ledger", storeId, startDate, endDate],
    queryFn: () => paymentService.finance(storeId, startDate, endDate),
    enabled: !!storeId && startDate <= endDate,
  });
  const weeks = useMemo(() => {
    const result = new Map<string, { net: number }>();
    data?.movements
      .filter((item) => statusFilter === "ALL" || item.status === statusFilter)
      .forEach((item) => {
        const date = new Date(item.createdAt);
        const monday = new Date(date);
        monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        const key = formatDate(monday);
        const row = result.get(key) || { net: 0 };
        row.net += item.netAmount;
        result.set(key, row);
      });
    return [...result.entries()].sort(([left], [right]) =>
      right.localeCompare(left),
    );
  }, [data, statusFilter]);
  const filteredMovements =
    data?.movements.filter(
      (item) => statusFilter === "ALL" || item.status === statusFilter,
    ) || [];
  const rows = () =>
    filteredMovements.map((item) => [
      item.id,
      item.subscriptionId,
      new Date(item.createdAt).toLocaleString("tr-TR"),
      sellerPaymentStatus(item.status).label,
      item.netAmount,
      item.currency,
    ]);
  const exportCsv = () =>
    downloadCsv(
      `finans-hareketleri-${startDate}-${endDate}.csv`,
      [
        "Ödeme No",
        "Abonelik No",
        "Tarih",
        "Durum",
        "Net Hakediş",
        "Para Birimi",
      ],
      rows(),
    );
  const exportExcel = () => {
    const header = [
      "Ödeme No",
      "Abonelik No",
      "Tarih",
      "Durum",
      "Net Hakediş",
      "Para Birimi",
    ];
    const html = `<table><tr>${header.map((value) => `<th>${value}</th>`).join("")}</tr>${rows()
      .map(
        (row) => `<tr>${row.map((value) => `<td>${value}</td>`).join("")}</tr>`,
      )
      .join("")}</table>`;
    const url = URL.createObjectURL(
      new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mutabakat-${startDate}-${endDate}.xls`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  if (isLoading)
    return (
      <div className="py-12 text-center text-slate-500">
        Finans hareketleri yükleniyor...
      </div>
    );
  if (isError || !data)
    return (
      <div className="rounded-xl bg-danger-50 p-5 text-danger-700">
        Finans verileri alınamadı.
      </div>
    );
  const movements = data.movements ?? [];
  const payouts = data.payouts ?? [];
  const cards = [["Gelir", data.netEarnings, "text-success-600"]];
  const nextPayout = payouts
    .filter((item) => item.status !== "PAID")
    .sort((a, b) =>
      String(a.scheduledAt || "").localeCompare(String(b.scheduledAt || "")),
    )[0];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Finans hareket defteri</h2>
          <p className="mt-1 text-sm text-slate-500">
            Gerçekleşen teslimatlara göre oluşan net hakedişinizi takip edin.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-sm font-bold"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-sm font-bold"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel / Mutabakat
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <label className="text-xs text-slate-500">
          Başlangıç
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm text-slate-800"
          />
        </label>
        <label className="text-xs text-slate-500">
          Bitiş
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm text-slate-800"
          />
        </label>
        <label className="text-xs text-slate-500">
          Durum
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-1 block rounded-lg border px-3 py-2 text-sm text-slate-800"
          >
            <option value="ALL">Tüm hareketler</option>
            {[...new Set(movements.map((item) => item.status))].map(
              (status) => (
                <option key={status} value={status}>
                  {sellerPaymentStatus(status).label}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      <div className="grid gap-4">
        {cards.map(([label, value, color]) => (
          <div key={String(label)} className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${color}`}>
              {money(Number(value))}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-4">
            <h3 className="font-semibold">Abonelik bazlı hareketler</h3>
            <p className="mt-1 text-xs text-slate-500">
              Dışa aktarımlar seçili tarih ve durum filtresini aynen kullanır.
            </p>
          </div>
          {filteredMovements.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="p-3">Tarih / Abonelik</th>
                    <th className="p-3">Durum</th>
                    <th className="p-3 text-right">Net hakediş</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMovements.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3">
                        <strong>#{item.subscriptionId}</strong>
                        <span className="block text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                      </td>
                      <td className="p-3">
                        <StatusBadge tone={sellerPaymentStatus(item.status).tone}>
                          {sellerPaymentStatus(item.status).label}
                        </StatusBadge>
                      </td>
                      <td className="p-3 text-right font-bold">
                        {money(item.netAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">
              Seçili filtrede finans hareketi yok.
            </p>
          )}
        </section>
        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold">Hakediş durumu</h3>
            <p className="mt-1 text-xs text-slate-500">
              Haftanın son geçerli teslimatı tamamlandıktan sonra, o hafta
              teslim edilen öğünler üzerinden hesaplanır.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ["Bekleyen", data.pendingPayout],
                ["Planlanan", data.scheduledPayout],
                ["Ödenen", data.paidPayout],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <strong>{money(Number(value))}</strong>
                </div>
              ))}
            </div>
            {nextPayout?.scheduledAt && (
              <p className="mt-4 rounded-xl bg-info-50 p-3 text-xs font-semibold text-info-800">
                Beklenen aktarım:{" "}
                {new Date(nextPayout.scheduledAt).toLocaleDateString("tr-TR")}
              </p>
            )}
          </div>
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold">Haftalık döküm</h3>
            <div className="mt-3 divide-y">
              {weeks.map(([week, row]) => (
                <div key={week} className="py-3 text-xs">
                  <strong>
                    {new Date(week).toLocaleDateString("tr-TR")} haftası
                  </strong>
                  <div className="mt-1 flex justify-between text-slate-500">
                    <span>Net {money(row.net)}</span>
                  </div>
                </div>
              ))}
              {!weeks.length && (
                <p className="text-sm text-slate-500">Hareket yok.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
