import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  CreditCard,
  RotateCcw,
  TicketPercent,
  CircleAlert,
} from "lucide-react";
import { adminService, type RiskCaseItem } from "@/services/adminService";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import QueryBoundary from "@/components/ui/QueryBoundary";
import StatusBadge from "@/components/ui/StatusBadge";

const riskGroups: {
  key: string;
  title: string;
  description: string;
  icon: typeof CreditCard;
  types: string[];
}[] = [
  {
    key: "accounts",
    title: "Çoklu hesap / kart kullanımı",
    description:
      "Aynı ödeme aracının birden fazla müşteri hesabında kullanılması.",
    icon: CreditCard,
    types: ["SHARED_PAYMENT_TOKEN"],
  },
  {
    key: "refunds",
    title: "Anormal iade oranı",
    description: "Ödeme tutarının önemli bir kısmının iade edildiği işlemler.",
    icon: RotateCcw,
    types: ["HIGH_REFUND_RATIO"],
  },
  {
    key: "coupons",
    title: "Kupon suistimali",
    description: "Aynı müşteri hesabında olağan dışı sayıda kupon kullanımı.",
    icon: TicketPercent,
    types: ["EXCESSIVE_COUPON_USAGE"],
  },
];

const severityTone = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
} as const;

export default function AdminRiskPage() {
  const client = useQueryClient();
  const [decisionTarget, setDecisionTarget] = useState<{
    item: RiskCaseItem;
    decision: "ACKNOWLEDGED" | "DISMISSED" | "REOPENED";
  } | null>(null);
  const [note, setNote] = useState("");
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [severityFilter, setSeverityFilter] = useState("");

  const query = useQuery({
    queryKey: ["admin-risk-cases"],
    queryFn: adminService.getRiskCases,
  });
  const decide = useMutation({
    mutationFn: () =>
      adminService.decideRiskCase(
        decisionTarget!.item.id,
        decisionTarget!.decision,
        note,
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-risk-cases"] });
      setDecisionTarget(null);
      setNote("");
    },
  });

  const grouped = useMemo(() => {
    const items = (query.data || []).filter(
      (item) =>
        (!statusFilter || item.status === statusFilter) &&
        (!severityFilter || item.severity === severityFilter),
    );
    const knownTypes = riskGroups.flatMap((group) => group.types);
    return [
      ...riskGroups.map((group) => ({
        ...group,
        items: items.filter((item) => group.types.includes(item.type)),
      })),
      {
        key: "other",
        title: "Diğer risk sinyalleri",
        description: "Yukarıdaki kategorilere girmeyen diğer bulgular.",
        icon: ShieldAlert,
        types: [],
        items: items.filter((item) => !knownTypes.includes(item.type)),
      },
    ].filter((group) => group.items.length > 0);
  }, [query.data, severityFilter, statusFilter]);

  const evidenceTarget = (item: RiskCaseItem) => {
    if (item.referenceType === "PAYMENT") return "/admin/finance";
    if (item.referenceType === "CUSTOMER") return `/admin/users/${item.referenceId}`;
    return "/admin/audit-search";
  };

  const openDecision = (
    item: RiskCaseItem,
    decision: "ACKNOWLEDGED" | "DISMISSED" | "REOPENED",
  ) => {
    setDecisionTarget({ item, decision });
    setNote(decision === "REOPENED" ? item.note : "");
  };

  return (
    <div className="mf-page space-y-6">
      <PageHeader
        eyebrow="Güvenlik"
        title="Risk yönetimi"
        description="Çoklu hesap/kart kullanımı, anormal iade ve kupon suistimali sinyallerini inceleyin ve gerekçeli karar verin."
      />

      <div className="rounded-2xl border border-info-100 bg-info-50 p-4 text-sm text-info-800">
        Risk sinyalleri müşteri hesabını, ödemeyi veya iadeyi otomatik olarak
        değiştirmez. Her karar gerekçe, yönetici ve zaman bilgisiyle kayıt altına
        alınır; verilmiş karar yeniden incelemeye açılabilir.
      </div>

      <section className="mf-surface flex flex-wrap gap-3 p-3" aria-label="Risk filtreleri">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mf-input w-auto" aria-label="Risk durum filtresi">
          <option value="">Tüm durumlar</option>
          <option value="OPEN">İnceleme bekliyor</option>
          <option value="ACKNOWLEDGED">İşleme alındı</option>
          <option value="DISMISSED">Kapatıldı</option>
        </select>
        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="mf-input w-auto" aria-label="Risk önem filtresi">
          <option value="">Tüm önem seviyeleri</option>
          <option value="HIGH">Yüksek önem</option>
          <option value="MEDIUM">Orta önem</option>
          <option value="LOW">Düşük önem</option>
        </select>
        {(statusFilter || severityFilter) && <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(""); setSeverityFilter(""); }}>Filtreleri temizle</Button>}
      </section>

      <QueryBoundary
        query={query}
        loadingLabel="Risk kayıtları taranıyor…"
        errorTitle="Risk kayıtları yüklenemedi"
        isEmpty={() => grouped.length === 0}
        emptyTitle="Açık risk sinyali bulunmuyor"
        emptyDescription="Yeni bir risk sinyali oluştuğunda burada listelenir."
      >
        {() =>
          grouped.map((group) => (
            <section key={group.key} className="mf-surface p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-danger-50 text-danger-600">
                  <group.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="mf-section-title">
                    {group.title}{" "}
                    <span className="ml-1 text-sm font-bold text-slate-400">
                      ({group.items.length})
                    </span>
                  </h2>
                  <p className="mf-muted mt-0.5">{group.description}</p>
                </div>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={severityTone[item.severity]}>
                          {item.severity === "HIGH"
                            ? "Yüksek önem"
                            : item.severity === "MEDIUM"
                              ? "Orta önem"
                              : "Düşük önem"}
                        </StatusBadge>
                        <StatusBadge
                          tone={
                            item.status === "OPEN"
                              ? "warning"
                              : item.status === "ACKNOWLEDGED"
                                ? "success"
                                : "neutral"
                          }
                        >
                          {item.status === "OPEN"
                            ? "İnceleme bekliyor"
                            : item.status === "ACKNOWLEDGED"
                              ? "Onaylandı"
                              : "Göz ardı edildi"}
                        </StatusBadge>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink">
                        {item.summary}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Kanıt kaydı: {item.referenceType} #{item.referenceId}
                      </p>
                      <Link to={evidenceTarget(item)} className="mt-2 inline-block text-xs font-bold text-primary-700 hover:underline">
                        İlişkili kaydı incele
                      </Link>
                      {item.status !== "OPEN" && item.note && (
                        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <b>Karar gerekçesi:</b> {item.note}
                          {item.assignedAdminName ? ` · Karar veren: ${item.assignedAdminName}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {item.status === "OPEN" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => openDecision(item, "ACKNOWLEDGED")}
                          >
                            Onayla / işlem başlat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDecision(item, "DISMISSED")}
                          >
                            Göz ardı et
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDecision(item, "REOPENED")}
                        >
                          Kararı geri al
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        }
      </QueryBoundary>

      {decisionTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <section
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Risk kararı"
          >
            <div className="flex gap-3">
              <CircleAlert className="text-warning-600" />
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-primary-600">
                  Risk kararı
                </p>
                <h2 className="font-black">
                  {decisionTarget.decision === "ACKNOWLEDGED"
                    ? "Riski onayla ve işlem başlat"
                    : decisionTarget.decision === "DISMISSED"
                      ? "Riski göz ardı et"
                      : "Kararı geri al"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {decisionTarget.item.summary}
                </p>
              </div>
            </div>
            <label className="mf-label mt-5 block">
              Gerekçe (zorunlu)
              <textarea
                required
                rows={4}
                maxLength={1000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Kararınızın gerekçesini yazın"
                className="mf-textarea mt-2 w-full"
              />
            </label>
            {decisionTarget.decision === "REOPENED" && (
              <p className="mt-2 text-xs text-slate-500">
                Kararı geri aldığınızda risk kaydı yeniden "İnceleme bekliyor"
                durumuna döner.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                onClick={() => setDecisionTarget(null)}
                variant="ghost"
                size="sm"
              >
                Vazgeç
              </Button>
              <Button
                disabled={!note.trim() || decide.isPending}
                onClick={() => decide.mutate()}
                size="sm"
              >
                {decide.isPending ? "Kaydediliyor..." : "Kararı kaydet"}
              </Button>
            </div>
            {decide.isError && (
              <p className="mt-3 text-sm text-danger-600">
                Karar kaydedilemedi.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
