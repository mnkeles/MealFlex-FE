import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import QueryBoundary from "@/components/ui/QueryBoundary";
import EmptyState from "@/components/ui/EmptyState";
import { adminService, type AdminSupportRequest } from "@/services/adminService";
import { parseApiError } from "@/utils/apiErrors";

const statusLabels: Record<AdminSupportRequest["status"], string> = {
  NEW: "Yeni",
  IN_PROGRESS: "İşlemde",
  ANSWERED: "Yanıtlandı",
  CLOSED: "Kapatıldı",
};

export default function AdminSupportRequestsPage() {
  const client = useQueryClient();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<AdminSupportRequest>();
  const [status, setStatus] = useState<"IN_PROGRESS" | "ANSWERED" | "CLOSED">("IN_PROGRESS");
  const [response, setResponse] = useState("");
  const requests = useQuery({
    queryKey: ["admin-support-requests", filter],
    queryFn: () => adminService.getSupportRequests(filter),
  });
  const update = useMutation({
    mutationFn: () => adminService.updateSupportRequest(selected!.id, { status, response: response || undefined }),
    onSuccess: (item) => {
      setSelected(item);
      setResponse(item.adminResponse || "");
      client.invalidateQueries({ queryKey: ["admin-support-requests"] });
    },
  });
  const open = (item: AdminSupportRequest) => {
    setSelected(item);
    setStatus(item.status === "NEW" ? "IN_PROGRESS" : item.status);
    setResponse(item.adminResponse || "");
    update.reset();
  };

  return (
    <div className="mf-page space-y-6">
      <PageHeader eyebrow="Destek merkezi" title="Destek talepleri"
        description="Müşteri ve satıcı taleplerini inceleyin, durumunu güncelleyin ve uygulama içinden yanıtlayın." />
      <section className="mf-surface flex flex-wrap items-center gap-3 p-4">
        <label className="text-sm font-bold text-slate-700">Durum</label>
        <select className="mf-input w-auto" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">Tüm talepler</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </section>
      <QueryBoundary query={requests}>
        {(data) => data.content.length === 0 ? (
          <EmptyState icon={<MessageSquareText className="h-6 w-6" />} title="Destek talebi bulunmuyor" description="Seçilen durumda kayıtlı bir talep yok." />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(480px,1.2fr)]">
            <section className="space-y-3">
              {data.content.map((item) => (
                <button key={item.id} type="button" onClick={() => open(item)}
                  className={`mf-surface w-full p-4 text-left transition ${selected?.id === item.id ? "ring-2 ring-primary-500" : "hover:border-primary-200"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">#{item.id} · {statusLabels[item.status]}</span>
                    <time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("tr-TR")}</time>
                  </div>
                  <h2 className="mt-2 font-semibold text-ink">{item.subject}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.contactName} · {item.accountRole === "SELLER" ? "Satıcı" : "Müşteri"}</p>
                </button>
              ))}
            </section>
            <section className="mf-surface min-h-80 p-5">
              {!selected ? (
                <div className="grid min-h-72 place-items-center text-center text-slate-500">İncelemek için soldan bir talep seçin.</div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Talep #{selected.id}</p>
                    <h2 className="mt-1 text-xl font-semibold text-ink">{selected.subject}</h2>
                    <p className="mt-2 text-sm text-slate-600">{selected.contactName} · {selected.contactEmail}{selected.contactPhone ? ` · ${selected.contactPhone}` : ""}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{selected.message}</div>
                  <label className="block text-sm font-bold text-slate-700">İşlem durumu
                    <select className="mf-input mt-2" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                      <option value="IN_PROGRESS">İşlemde</option><option value="ANSWERED">Yanıtlandı</option><option value="CLOSED">Kapatıldı</option>
                    </select>
                  </label>
                  <label className="block text-sm font-bold text-slate-700">Kullanıcıya yanıt
                    <textarea className="mf-input mt-2 min-h-36 resize-y" maxLength={3000} value={response}
                      onChange={(event) => setResponse(event.target.value)} placeholder="Yanıt yazıldığında kullanıcıya uygulama bildirimi gönderilir." />
                  </label>
                  {update.isError && <p role="alert" className="text-sm font-semibold text-danger-600">{parseApiError(update.error, "Talep güncellenemedi.").message}</p>}
                  {update.isSuccess && <p role="status" className="text-sm font-semibold text-success-700">Talep güncellendi{response ? " ve kullanıcıya bildirim gönderildi." : "."}</p>}
                  <button type="button" disabled={update.isPending || (status === "ANSWERED" && response.trim().length === 0)}
                    onClick={() => update.mutate()} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                    {update.isPending ? "Kaydediliyor…" : "Talebi güncelle"}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
