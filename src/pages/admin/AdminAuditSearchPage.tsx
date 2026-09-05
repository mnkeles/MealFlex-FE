import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { adminService, type AuditEntry } from "@/services/adminService";
import AuditTimeline from "@/components/admin/AuditTimeline";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import QueryBoundary from "@/components/ui/QueryBoundary";
import StatusBadge from "@/components/ui/StatusBadge";
import { auditEntityOptions } from "@/constants/adminLabels";

const readableType: Record<string, string> = {
  users: "Kullanıcılar",
  user: "Kullanıcı",
  stores: "Mağazalar",
  store: "Mağaza",
  subscription: "Abonelik",
  delivery: "Teslimat",
  payment: "Ödeme",
  complaint: "Şikâyet",
};
const sensitiveField = /password|token|secret|card|iban|phone|email/i;
const safeValue = (key: string, value: unknown) =>
  sensitiveField.test(key) && value ? "••••••••" : String(value ?? "—");

export default function AdminAuditSearchPage() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [params, setParams] = useSearchParams();
  const actorId = params.get("actorId") || "";
  const entityType = params.get("entityType") || "";
  const action = params.get("action") || "";
  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";
  const page = Math.max(0, Number(params.get("page") || 0));
  const invalidRange = !!startDate && !!endDate && startDate > endDate;
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };
  const resetAuditFilters = () => setParams({}, { replace: true });

  const searchQuery = useQuery({
    queryKey: ["admin-support-search", term],
    queryFn: () => adminService.supportSearch(term),
    enabled: !!term,
  });
  const auditQuery = useQuery({
    queryKey: ["admin-audit-logs", page, actorId, entityType, action, startDate, endDate],
    queryFn: () => adminService.getAuditLogs({
      page,
      actorId: actorId ? Number(actorId) : undefined,
      entityType: entityType || undefined,
      action: action || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    enabled: !invalidRange,
  });
  const results = Object.entries(searchQuery.data || {}).filter(([key]) => key !== "audits");
  const searchAudits = (searchQuery.data?.audits || []) as AuditEntry[];
  const hasAuditFilters = !!(actorId || entityType || action || startDate || endDate);

  return (
    <div className="mf-page space-y-6">
      <PageHeader
        eyebrow="Güvenlik ve destek"
        title="Global arama ve audit"
        description="Operasyon kayıtlarını bulun; audit hareketlerini aktör, işlem, kayıt türü ve tarihe göre inceleyin."
      />

      <section className="mf-surface p-4">
        <h2 className="font-black text-ink">Kayıt bul</h2>
        <form onSubmit={(event) => { event.preventDefault(); setTerm(input.trim()); }} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Örn. ad@ornek.com, mağaza adı veya #123" className="mf-input w-full pl-9" aria-label="Global admin araması" />
          </label>
          <Button type="submit" disabled={!input.trim() || searchQuery.isFetching}>{searchQuery.isFetching ? "Aranıyor…" : "Ara"}</Button>
        </form>
      </section>

      {searchQuery.isError && <EmptyState title="Arama tamamlanamadı" description="Bağlantıyı kontrol edip tekrar deneyin." action={<Button variant="outline" size="sm" onClick={() => searchQuery.refetch()}>Tekrar dene</Button>} />}
      {searchQuery.data && (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            {results.map(([type, value]) => (
              <article key={type} className="mf-surface p-5">
                <div className="flex items-center justify-between gap-3"><h2 className="font-black text-ink">{readableType[type] || type}</h2><StatusBadge tone="info">Eşleşen kayıt</StatusBadge></div>
                <dl className="mt-4 space-y-2 text-sm">
                  {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
                    <div key={key} className="grid grid-cols-[minmax(100px,.35fr)_1fr] gap-3 border-b border-slate-100 pb-2 last:border-0"><dt className="font-semibold text-slate-500">{key}</dt><dd className="break-all font-medium text-slate-700">{safeValue(key, item)}</dd></div>
                  ))}
                </dl>
              </article>
            ))}
          </section>
          {!results.length && <EmptyState title="Eşleşen kayıt yok" description="Bu aramayla eşleşen operasyon kaydı bulunamadı." />}
          {!!searchAudits.length && <AuditTimeline audits={searchAudits} title="Eşleşen kaydın işlem geçmişi" />}
        </>
      )}

      <section className="mf-surface p-4" aria-label="Audit filtreleri">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary-600" /><h2 className="font-black text-ink">Audit hareketleri</h2></div>
          {hasAuditFilters && <Button variant="ghost" size="sm" onClick={resetAuditFilters}>Filtreleri temizle</Button>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="mf-label">Aktör no<input type="number" min="1" value={actorId} onChange={(e) => setFilter("actorId", e.target.value)} className="mf-input mt-1 w-full" /></label>
          <label className="mf-label">Kayıt türü<select value={entityType} onChange={(e) => setFilter("entityType", e.target.value)} className="mf-input mt-1 w-full"><option value="">Tüm kayıt türleri</option>{auditEntityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="mf-label">İşlem<input value={action} onChange={(e) => setFilter("action", e.target.value)} placeholder="Örn. RISK veya REFUND" className="mf-input mt-1 w-full" /></label>
          <label className="mf-label">Başlangıç<input type="date" value={startDate} max={endDate || undefined} onChange={(e) => setFilter("startDate", e.target.value)} className="mf-input mt-1 w-full" /></label>
          <label className="mf-label">Bitiş<input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setFilter("endDate", e.target.value)} className="mf-input mt-1 w-full" /></label>
        </div>
        {invalidRange && <p role="alert" className="mt-3 text-sm font-semibold text-danger-600">Bitiş tarihi başlangıç tarihinden önce olamaz.</p>}
      </section>

      {!invalidRange && (
        <QueryBoundary query={auditQuery} loadingLabel="Audit kayıtları yükleniyor…" errorTitle="Audit kayıtları yüklenemedi" isEmpty={(data) => data.content.length === 0} emptyTitle="Bu filtrede audit kaydı yok" emptyDescription="Filtreleri değiştirerek tekrar deneyin." emptyAction={hasAuditFilters ? <Button variant="outline" size="sm" onClick={resetAuditFilters}>Filtreleri temizle</Button> : undefined}>
          {(data) => (
            <>
              <AuditTimeline audits={data.content} title="Filtrelenmiş işlem geçmişi" description={`${data.totalElements} kayıt bulundu. Hassas alanlar maskelenir.`} />
              {data.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={data.first} onClick={() => setFilter("page", String(page - 1))}>Önceki</Button>
                  <label className="text-sm text-slate-600">Sayfa<select aria-label="Audit sayfası" value={page} onChange={(e) => setFilter("page", e.target.value)} className="mf-input ml-2 w-auto py-1.5">{Array.from({ length: data.totalPages }, (_, index) => <option key={index} value={index}>{index + 1}</option>)}</select><span className="ml-2">/ {data.totalPages}</span></label>
                  <Button variant="outline" size="sm" disabled={data.last} onClick={() => setFilter("page", String(page + 1))}>Sonraki</Button>
                </div>
              )}
            </>
          )}
        </QueryBoundary>
      )}
    </div>
  );
}
