import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { adminService, type AdminComplaint } from "@/services/adminService";
import ComplaintListCard from "@/components/admin/ComplaintListCard";
import ComplaintResolutionForm, {
  type ResolutionState,
} from "@/components/admin/ComplaintResolutionForm";
import { resolutions } from "@/constants/complaintResolutions";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import QueryBoundary from "@/components/ui/QueryBoundary";
import { complaintStatuses, uiStatus } from "@/constants/statuses";

export default function AdminComplaintsPage() {
  const client = useQueryClient();
  const [selected, setSelected] = useState<AdminComplaint>();
  const [status, setStatus] = useState("IN_REVIEW");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [slaOnly, setSlaOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState<ResolutionState>({
    resolutionType: "NO_COMPENSATION",
    reason: "",
    customerMessage: "",
    internalNote: "",
    amount: "",
    compensationDate: "",
  });
  const complaints = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: () => adminService.getComplaints(),
  });
  const attachments = useQuery({
    queryKey: ["admin-complaint-attachments", selected?.id],
    queryFn: () => adminService.getComplaintAttachments(selected!.id),
    enabled: !!selected,
  });
  const context = useQuery({
    queryKey: ["admin-complaint-context", selected?.id],
    queryFn: () => adminService.getComplaintContext(selected!.id),
    enabled: !!selected,
  });
  const open = (item: AdminComplaint) => {
    setSelected(item);
    setStatus(item.status);
    setNote(item.adminNote || "");
    setResolution({
      resolutionType: "NO_COMPENSATION",
      reason: "",
      customerMessage: item.customerMessage || "",
      internalNote: item.internalNote || "",
      amount: "",
      compensationDate: "",
    });
  };
  const update = useMutation({
    mutationFn: () =>
      adminService.updateComplaint(selected!.id, { status, adminNote: note }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-complaints"] });
      setSelected(undefined);
    },
  });
  const resolve = useMutation({
    mutationFn: () =>
      adminService.resolveComplaint(selected!.id, {
        resolutionType: resolution.resolutionType,
        reason: resolution.reason,
        customerMessage: resolution.customerMessage,
        internalNote: resolution.internalNote || undefined,
        amount: resolution.amount ? Number(resolution.amount) : undefined,
        compensationDate: resolution.compensationDate || undefined,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-complaints"] });
      setSelected(undefined);
    },
  });
  const visibleComplaints = (complaints.data?.content || []).filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (
      slaOnly &&
      !(
        ["OPEN", "IN_REVIEW"].includes(item.status) &&
        Date.now() - new Date(item.createdAt).getTime() >= 20 * 60 * 60 * 1000
      )
    )
      return false;
    if (dateFrom && item.createdAt.slice(0, 10) < dateFrom) return false;
    const haystack =
      `${item.id} ${item.reason} ${item.description} ${item.store?.name || ""} ${item.customer?.firstName || ""} ${item.customer?.lastName || ""}`.toLocaleLowerCase(
        "tr-TR",
      );
    return haystack.includes(search.trim().toLocaleLowerCase("tr-TR"));
  });

  return (
    <div className="mf-page space-y-6">
      <PageHeader
        eyebrow="Destek merkezi"
        title="Şikâyet ve anlaşmazlıklar"
        description="Şikâyetleri müşteri, satıcı, teslimat ve ödeme bağlamıyla birlikte inceleyin; kararınızı kayıt altına alın."
      />
      <section className="mf-surface flex flex-wrap gap-3 p-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Müşteri, mağaza, konu veya kayıt no ara"
          className="mf-input min-w-56 flex-1"
          aria-label="Şikâyet ara"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="mf-input w-auto min-w-44"
        >
          <option value="">Tüm durumlar</option>
          {Object.entries(complaintStatuses).map(([value, item]) => (
            <option key={value} value={value}>
              {item.label}
            </option>
          ))}
        </select>
        <label className="text-xs font-bold text-slate-600">
          Başlangıç
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="mf-input mt-1 w-auto"
          />
        </label>
        <button
          type="button"
          onClick={() => setSlaOnly((value) => !value)}
          className={`rounded-xl border px-3 py-2 text-xs font-bold ${slaOnly ? "border-danger-200 bg-danger-50 text-danger-700" : "border-slate-200 bg-white text-slate-600"}`}
        >
          SLA yaklaşanlar
        </button>
      </section>
      <QueryBoundary
        query={complaints}
        loadingLabel="Şikâyetler yükleniyor…"
        errorTitle="Şikâyetler yüklenemedi"
        errorDescription="Bağlantıyı kontrol edip tekrar deneyin."
        isEmpty={(result) => result.content.length === 0}
        emptyTitle="Şikâyet bulunamadı"
        emptyDescription="Yeni şikâyetler bu alanda görünür."
      >
        {() =>
          visibleComplaints.length ? (
            <div className="grid gap-4">
              {visibleComplaints.map((item) => (
                <ComplaintListCard key={item.id} item={item} onOpen={open} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Bu filtrede şikâyet bulunamadı"
              description="Arama metnini veya durum filtresini değiştirin."
            />
          )
        }
      </QueryBoundary>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-floating"
            role="dialog"
            aria-modal="true"
            aria-label="Şikâyet kararı"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                  Şikâyet #{selected.id}
                </p>
                <h2 className="text-xl font-semibold text-ink">Karar ve telafi</h2>
              </div>
              <StatusBadge
                tone={uiStatus(complaintStatuses, selected.status).tone}
              >
                {uiStatus(complaintStatuses, selected.status).label}
              </StatusBadge>
            </div>
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {selected.description}
            </p>
            {selected.sellerResponse && (
              <div className="mt-3 rounded-xl bg-primary-50 p-4 text-sm text-primary-800">
                <b>Satıcı yanıtı:</b> {selected.sellerResponse}
              </div>
            )}
            {(context.data?.delivery || context.data?.payment) && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {context.data.delivery && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Teslimat
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      #{context.data.delivery.id} ·{" "}
                      {new Date(context.data.delivery.date).toLocaleDateString(
                        "tr-TR",
                      )}
                      {context.data.delivery.time
                        ? ` · ${context.data.delivery.time.slice(0, 5)}`
                        : ""}
                    </p>
                    <div className="mt-2">
                      <StatusBadge
                        domain="delivery"
                        status={context.data.delivery.status}
                      />
                    </div>
                  </div>
                )}
                {context.data.payment && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ödeme
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink">
                      #{context.data.payment.id} ·{" "}
                      {context.data.payment.amount.toLocaleString("tr-TR")}{" "}
                      {context.data.payment.currency}
                    </p>
                    <div className="mt-2">
                      <StatusBadge
                        domain="payment"
                        status={context.data.payment.status}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {!!attachments.data?.length && (
              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <b className="text-sm">Güvenli ekler</b>
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.data.map((file) => (
                    <Button
                      key={file.id}
                      onClick={() =>
                        adminService.openProtectedFile(file.fileUrl)
                      }
                      variant="outline"
                      size="sm"
                      leftIcon={<ExternalLink size={14} />}
                    >
                      {file.fileName}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <label className="mf-label">
                Durum
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mf-input mt-2 w-full"
                >
                  {Object.entries(complaintStatuses).map(([value, item]) => (
                    <option key={value} value={value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mf-label">
                Ara not
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="mf-textarea mt-2 w-full"
                />
              </label>
            </div>
            <Button
              onClick={() => update.mutate()}
              disabled={update.isPending}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              İnceleme durumunu kaydet
            </Button>
            {selected.resolutionType && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <b className="text-ink">Önceki karar:</b>{" "}
                {resolutions.find(
                  (item) => item.value === selected.resolutionType,
                )?.label || selected.resolutionType}
                {selected.resolutionAmount
                  ? ` · ${selected.resolutionAmount.toLocaleString("tr-TR")} ₺`
                  : ""}
                {selected.compensationCode
                  ? ` · Kupon: ${selected.compensationCode}`
                  : ""}
                <p className="mt-2 text-xs text-slate-500">
                  Bu kayıt otomatik olarak geri alınmaz: yeni bir karar seçip
                  kaydettiğinizde durum güncellenir ve her iki karar da audit
                  geçmişinde tutulur, ancak iade/kupon gibi mali işlemler ayrıca
                  manuel olarak iptal edilmelidir.
                </p>
              </div>
            )}
            <ComplaintResolutionForm
              resolution={resolution}
              setResolution={setResolution}
              onCancel={() => setSelected(undefined)}
              onSubmit={() => resolve.mutate()}
              pending={resolve.isPending}
            />
            {(update.isError || resolve.isError) && (
              <p className="mt-3 text-sm text-danger-600">
                İşlem tamamlanamadı. Alanları ve ödeme durumunu kontrol edin.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
