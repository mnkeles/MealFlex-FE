import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import {
  Download,
  FileSpreadsheet,
  Printer,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { sellerService } from "@/services/sellerService";
import { downloadCsv } from "@/utils/csv";
import QueryBoundary from "@/components/ui/QueryBoundary";

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const addDays = (value: string, days: number) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};
const trDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ]!,
  );

export default function StoreProductionPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const client = useQueryClient();
  const [mode, setMode] = useState<"day" | "week">("week");
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const endDate = mode === "week" ? addDays(startDate, 6) : startDate;
  const query = useQuery({
    queryKey: ["production-summary", storeId, startDate, endDate],
    queryFn: () =>
      sellerService.getProductionSummary(storeId, startDate, endDate),
    enabled: !!storeId,
  });
  const closeDay = useMutation({
    mutationFn: (date: string) =>
      sellerService.addClosedDate(storeId, {
        closedDate: date,
        reason: "Üretim takviminden kapatıldı",
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["production-summary", storeId] }),
  });
  const openDay = useMutation({
    mutationFn: (id: number) => sellerService.deleteClosedDate(storeId, id),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["production-summary", storeId] }),
  });
  const data = query.data;
  const rows = useMemo(
    () =>
      data?.preparationList.map((item) => [
        item.deliveryDate,
        item.deliveryTime,
        item.menuName,
        item.personCount,
        item.customerName,
        item.deliveryAddress,
        item.notes || "",
        item.status,
      ]) || [],
    [data],
  );
  const exportCsv = () =>
    downloadCsv(
      `uretim-${startDate}-${endDate}.csv`,
      ["Tarih", "Saat", "Menü", "Porsiyon", "Müşteri", "Adres", "Not", "Durum"],
      rows,
    );
  const exportExcel = () => {
    const headings = [
      "Tarih",
      "Saat",
      "Menü",
      "Porsiyon",
      "Müşteri",
      "Adres",
      "Not",
      "Durum",
    ];
    const html = `<meta charset="utf-8"><table><tr>${headings.map((item) => `<th>${escapeHtml(item)}</th>`).join("")}</tr>${rows.map((row) => `<tr>${row.map((item) => `<td>${escapeHtml(item)}</td>`).join("")}</tr>`).join("")}</table>`;
    const url = URL.createObjectURL(
      new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `uretim-${startDate}-${endDate}.xls`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const printKitchen = () => {
    if (!data) return;
    const popup = window.open("", "_blank", "width=960,height=720");
    if (!popup) return;
    const menuItems = data.menus
      .map(
        (menu) =>
          `<li>${escapeHtml(menu.menuName)}: <b>${menu.portions} porsiyon</b></li>`,
      )
      .join("");
    const preparationRows = data.preparationList
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.deliveryDate)} ${escapeHtml(item.deliveryTime)}</td>
          <td>${escapeHtml(item.menuName)}</td>
          <td>${item.personCount}</td>
          <td>${escapeHtml(item.customerName)}</td>
          <td>${escapeHtml(item.deliveryAddress)}<br>${escapeHtml(item.notes || "")}</td>
        </tr>`,
      )
      .join("");
    const printHtml = [
      "<html><head><title>Mutfak Üretim Listesi</title>",
      "<style>body{font:14px Arial;padding:24px}h1{margin-bottom:4px}",
      "table{border-collapse:collapse;width:100%;margin-top:20px}",
      "th,td{border:1px solid #bbb;padding:8px;text-align:left}",
      "th{background:#eee}.total{font-size:18px;font-weight:bold}</style></head><body>",
      "<h1>Mutfak Üretim Listesi</h1>",
      `<p>${escapeHtml(startDate)} — ${escapeHtml(endDate)}</p>`,
      `<p class="total">${data.totalPortions} porsiyon · ${data.totalDeliveries} teslimat</p>`,
      `<h2>Menü dağılımı</h2><ul>${menuItems}</ul>`,
      "<table><thead><tr><th>Tarih/Saat</th><th>Menü</th><th>Porsiyon</th>",
      "<th>Müşteri</th><th>Adres/Not</th></tr></thead>",
      `<tbody>${preparationRows}</tbody></table></body></html>`,
    ].join("");
    popup.document.write(printHtml);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Operasyon ve Üretim Takvimi</h2>
          <p className="mt-1 text-sm text-slate-500">
            Porsiyonları menü ve teslimat saatine göre mutfak için hazırlayın.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCsv}
            disabled={!rows.length}
            className="flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-sm font-bold disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={exportExcel}
            disabled={!rows.length}
            className="flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-sm font-bold disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={printKitchen}
            disabled={!rows.length}
            className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            <Printer className="h-4 w-4" />
            Mutfak çıktısı
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setMode("day")}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "day" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            Günlük
          </button>
          <button
            onClick={() => setMode("week")}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "week" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            Haftalık
          </button>
        </div>
        <label className="text-xs font-bold text-slate-500">
          {mode === "week" ? "Hafta başlangıcı" : "Gün"}
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-1 block rounded-xl border px-3 py-2 text-sm text-slate-800"
          />
        </label>
        <span className="pb-2 text-sm text-slate-500">
          {trDate(startDate)} — {trDate(endDate)}
        </span>
      </div>
      <QueryBoundary
        query={query}
        loadingLabel="Üretim planı hazırlanıyor…"
        errorTitle="Üretim planı alınamadı"
        errorDescription="Tarih aralığını ve bağlantınızı kontrol edip tekrar deneyin."
      >
        {(data) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-white p-5">
                <UtensilsCrossed className="h-5 w-5 text-primary-600" />
                <p className="mt-3 text-sm text-slate-500">Toplam porsiyon</p>
                <p className="text-3xl font-semibold">{data.totalPortions}</p>
              </div>
              <div className="rounded-xl border bg-white p-5">
                <Users className="h-5 w-5 text-info-600" />
                <p className="mt-3 text-sm text-slate-500">Teslimat</p>
                <p className="text-3xl font-semibold">{data.totalDeliveries}</p>
              </div>
            </div>
            <section>
              <div className="mb-2">
                <h3 className="font-semibold">Takvim</h3>
              </div>
              <div
                className={`grid gap-3 ${mode === "week" ? "sm:grid-cols-2 xl:grid-cols-7" : ""}`}
              >
                {data.days.map((day) => (
                  <article
                    key={day.date}
                    className={`rounded-xl border p-4 ${day.closedDateId ? "border-danger-200 bg-danger-50" : "bg-white"}`}
                  >
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {trDate(day.date)}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{day.portions}</p>
                    <p className="text-xs text-slate-500">
                      porsiyon · {day.deliveryCount} teslimat
                    </p>
                    {day.closedDateId ? (
                      <button
                        disabled={openDay.isPending}
                        onClick={() => openDay.mutate(day.closedDateId!)}
                        className="mt-3 text-xs font-semibold text-success-700"
                      >
                        Günü yeniden aç
                      </button>
                    ) : (
                      <button
                        disabled={closeDay.isPending || day.deliveryCount > 0}
                        title={
                          day.deliveryCount
                            ? "Teslimat bulunan gün kapatılamaz"
                            : ""
                        }
                        onClick={() => closeDay.mutate(day.date)}
                        className="mt-3 text-xs font-semibold text-danger-600 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        Günü kapat
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-xl border bg-white p-5">
                <h3 className="font-semibold">Menü bazlı porsiyon</h3>
                <div className="mt-4 space-y-4">
                  {data.menus.map((menu) => (
                    <div key={menu.menuId}>
                      <div className="flex justify-between text-sm">
                        <span>{menu.menuName}</span>
                        <strong>{menu.portions} porsiyon</strong>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{
                            width: `${data.totalPortions ? (menu.portions / data.totalPortions) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {!data.menus.length && (
                    <p className="text-sm text-slate-500">
                      Bu dönemde üretim yok.
                    </p>
                  )}
                </div>
              </section>
              <section className="rounded-xl border bg-white p-5">
                <h3 className="font-semibold">Teslimat saati yoğunluğu</h3>
                <div className="mt-3 divide-y">
                  {data.timeSlots.map((slot) => (
                    <div
                      key={slot.deliveryTime}
                      className="flex items-center justify-between py-3 text-sm"
                    >
                      <strong>{slot.deliveryTime.slice(0, 5)}</strong>
                      <span className="text-slate-500">
                        {slot.deliveryCount} teslimat ·{" "}
                        <b className="text-slate-800">
                          {slot.portions} porsiyon
                        </b>
                      </span>
                    </div>
                  ))}
                  {!data.timeSlots.length && (
                    <p className="py-3 text-sm text-slate-500">
                      Yoğunluk verisi yok.
                    </p>
                  )}
                </div>
              </section>
            </div>
            <section className="overflow-hidden rounded-xl border bg-white">
              <div className="border-b p-4">
                <h3 className="font-semibold">Toplu hazırlık listesi</h3>
              </div>
              {rows.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="p-3">Tarih / Saat</th>
                        <th className="p-3">Menü</th>
                        <th className="p-3">Porsiyon</th>
                        <th className="p-3">Müşteri</th>
                        <th className="p-3">Adres / Not</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.preparationList.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3 font-bold">
                            {trDate(item.deliveryDate)}
                            <span className="block text-primary-600">
                              {item.deliveryTime.slice(0, 5)}
                            </span>
                          </td>
                          <td className="p-3">{item.menuName}</td>
                          <td className="p-3 text-lg font-semibold">
                            {item.personCount}
                          </td>
                          <td className="p-3">{item.customerName}</td>
                          <td className="max-w-sm p-3 text-xs text-slate-500">
                            {item.deliveryAddress}
                            {item.notes && (
                              <span className="mt-1 block font-semibold text-info-600">
                                Not: {item.notes}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-10 text-center text-sm text-slate-500">
                  Seçili dönemde hazırlanacak teslimat yok.
                </p>
              )}
            </section>
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
