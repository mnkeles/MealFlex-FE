import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileWarning,
  ShieldCheck,
} from "lucide-react";
import {
  adminService,
  type AdminSellerDocument,
} from "@/services/adminService";
import AuditTimeline from "@/components/admin/AuditTimeline";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";

const typeLabels: Record<string, string> = {
  TRADE_REGISTRY: "Ticaret sicil belgesi",
  TAX_CERTIFICATE: "Vergi levhası",
  FOOD_LICENSE: "Gıda ruhsatı",
  HYGIENE_CERTIFICATE: "Hijyen belgesi",
};

export default function AdminSellerOnboardingPage() {
  const client = useQueryClient();
  const [status, setStatus] = useState("PENDING");
  const [selected, setSelected] = useState<AdminSellerDocument>();
  const [reason, setReason] = useState("");
  const documents = useQuery({
    queryKey: ["admin-seller-documents", status],
    queryFn: () =>
      adminService.getSellerDocuments(
        status === "MISSING" ? undefined : status || undefined,
      ),
  });
  const history = useQuery({
    queryKey: ["admin-seller-document-history", selected?.id],
    queryFn: () => adminService.getSellerDocumentHistory(selected!.id),
    enabled: !!selected,
  });
  const review = useMutation({
    mutationFn: ({ approve }: { approve: boolean }) =>
      adminService.reviewSellerDocument(selected!.id, approve, reason),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-seller-documents"] });
      setSelected(undefined);
      setReason("");
    },
  });

  return (
    <div className="mf-page space-y-6">
      <PageHeader
        eyebrow="Başvuru merkezi"
        title="Satıcı onboarding"
        description="Zorunlu belgeleri güvenli biçimde inceleyin; eksikleri görünür kılın ve kararınızı gerekçesiyle kaydedin."
        actions={
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mf-input min-w-44"
          >
            <option value="PENDING">Onay bekleyen</option>
            <option value="MISSING">Eksik bilgi</option>
            <option value="REJECTED">Reddedilen</option>
            <option value="VERIFIED">Onaylanan</option>
            <option value="">Tümü</option>
          </select>
        }
      />

      {documents.isError ? (
        <EmptyState
          title="Belgeler yüklenemedi"
          description="Bağlantıyı kontrol edip sayfayı yenileyin."
          action={
            <Button
              onClick={() => documents.refetch()}
              variant="outline"
              size="sm"
            >
              Tekrar dene
            </Button>
          }
        />
      ) : documents.isLoading ? (
        <div className="mf-surface p-10 text-center text-sm text-slate-500">
          Belgeler yükleniyor…
        </div>
      ) : (
        (() => {
          const visibleDocuments = (documents.data || []).filter(
            (document) =>
              status !== "MISSING" ||
              !document.readyForPublication ||
              document.missingDocumentTypes.length > 0,
          );
          return !visibleDocuments.length ? (
            <EmptyState
              title="Bu durumda belge bulunmuyor"
              description="Farklı bir belge durumu seçerek tekrar kontrol edin."
            />
          ) : (
            <div className="grid gap-4">
              {visibleDocuments.map((document) => {
                const checks = [
                  document.contractAccepted,
                  document.verificationStatus === "VERIFIED",
                  document.missingDocumentTypes.length === 0,
                ];
                const progress = Math.round(
                  (checks.filter(Boolean).length / checks.length) * 100,
                );
                return (
                  <article key={document.id} className="mf-surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-ink">
                            {document.storeName}
                          </h2>
                          <StatusBadge
                            tone={
                              document.readyForPublication
                                ? "success"
                                : "warning"
                            }
                          >
                            {document.readyForPublication
                              ? "Yayına hazır"
                              : "Eksik bilgi var"}
                          </StatusBadge>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {typeLabels[document.documentType] ||
                            document.documentType}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {document.fileName}
                        </p>
                        <div className="mt-3 rounded-xl bg-slate-50 p-3">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>Başvuru kontrol listesi</span>
                            <span>%{progress}</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full bg-primary-600"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                            <span
                              className={
                                checks[0]
                                  ? "text-success-700"
                                  : "text-warning-700"
                              }
                            >
                              {checks[0] ? "✓ Sözleşme" : "○ Sözleşme"}
                            </span>
                            <span
                              className={
                                checks[1]
                                  ? "text-success-700"
                                  : "text-warning-700"
                              }
                            >
                              {checks[1] ? "✓ Belge onayı" : "○ Belge onayı"}
                            </span>
                            <span
                              className={
                                checks[2]
                                  ? "text-success-700"
                                  : "text-warning-700"
                              }
                            >
                              {checks[2] ? "✓ Eksik yok" : "○ Eksik belge"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                          <span
                            className={
                              document.contractAccepted
                                ? "text-success-700"
                                : "text-warning-700"
                            }
                          >
                            {document.contractAccepted
                              ? "Sözleşme onaylandı"
                              : "Sözleşme onayı bekliyor"}
                          </span>
                          {document.expiryDate && (
                            <span className="text-slate-500">
                              Son geçerlilik:{" "}
                              {new Date(document.expiryDate).toLocaleDateString(
                                "tr-TR",
                              )}
                            </span>
                          )}
                        </div>
                        {document.missingDocumentTypes.length > 0 && (
                          <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-warning-700">
                            <FileWarning size={14} />
                            Eksik:{" "}
                            {document.missingDocumentTypes
                              .map((type) => typeLabels[type] || type)
                              .join(", ")}
                          </p>
                        )}
                        {document.expiringDocumentTypes.length > 0 && (
                          <p className="mt-2 text-xs font-semibold text-warning-700">
                            30 gün içinde süresi dolacak:{" "}
                            {document.expiringDocumentTypes
                              .map((type) => typeLabels[type] || type)
                              .join(", ")}
                          </p>
                        )}
                        {document.rejectionReason && (
                          <p className="mt-3 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
                            Ret / yeniden yükleme talebi:{" "}
                            {document.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          onClick={() =>
                            adminService.openProtectedFile(document.fileUrl)
                          }
                          variant="outline"
                          size="sm"
                          leftIcon={<ExternalLink size={15} />}
                        >
                          Belgeyi aç
                        </Button>
                        {document.verificationStatus === "PENDING" && (
                          <Button
                            onClick={() => setSelected(document)}
                            size="sm"
                            leftIcon={<ShieldCheck size={15} />}
                          >
                            İncele
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })()
      )}

      <Modal
        open={!!selected}
        title="Belge inceleme kararı"
        onClose={() => setSelected(undefined)}
        footer={
          <>
            <Button
              onClick={() => setSelected(undefined)}
              variant="ghost"
              size="sm"
            >
              Vazgeç
            </Button>
            <Button
              onClick={() => review.mutate({ approve: false })}
              disabled={!reason.trim() || review.isPending}
              variant="danger"
              size="sm"
            >
              Reddet / yeniden yükle
            </Button>
            <Button
              onClick={() => review.mutate({ approve: true })}
              disabled={!reason.trim() || review.isPending}
              size="sm"
              leftIcon={<CheckCircle2 size={15} />}
            >
              Onayla
            </Button>
          </>
        }
      >
        {selected && (
          <>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-primary-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">
                  Belge inceleme
                </p>
                <h2 className="font-semibold text-ink">{selected.storeName}</h2>
                <p className="text-sm text-slate-500">
                  {typeLabels[selected.documentType] || selected.documentType}
                </p>
              </div>
            </div>
            <label className="mf-label mt-5 block">
              Karar gerekçesi
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Onay veya yeniden yükleme kararını açıklayın"
                className="mf-textarea mt-2 w-full"
              />
            </label>
            <p className="mt-1 text-right text-xs text-slate-500">
              {reason.length}/500
            </p>
            {review.isError && (
              <p className="mt-3 text-sm text-danger-600">
                Belge kararı kaydedilemedi.
              </p>
            )}
            <div className="mt-5">
              <AuditTimeline
                audits={history.data || []}
                title="Karar geçmişi"
                description="Bu belge için verilmiş önceki kararlar."
                emptyLabel="Bu belge için henüz karar verilmedi."
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
