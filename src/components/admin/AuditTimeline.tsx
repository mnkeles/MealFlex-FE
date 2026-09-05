import { ShieldCheck } from "lucide-react";
import type { AuditEntry } from "@/services/adminService";
import { adminActionLabel, adminEntityLabel } from "@/constants/adminLabels";

const sensitiveField = /password|token|secret|card|iban|phone|email/i;
const safeValue = (key: string, value: unknown) =>
  sensitiveField.test(key) && value ? "••••••••" : String(value ?? "—");
const parseObject = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value !== "string") return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
};

function AuditValue({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: unknown;
  tone?: "neutral" | "primary";
}) {
  const parsed = parseObject(value);
  const surface =
    tone === "primary"
      ? "bg-primary-50 text-primary-800"
      : "bg-slate-50 text-slate-700";
  if (!parsed)
    return (
      <div className={`mt-2 rounded-lg p-3 text-xs ${surface}`}>
        <b>{label}:</b> {String(value)}
      </div>
    );
  return (
    <div className={`mt-2 rounded-lg p-3 text-xs ${surface}`}>
      <b>{label}</b>
      <dl className="mt-2 space-y-1">
        {Object.entries(parsed).map(([key, item]) => (
          <div
            key={key}
            className="grid grid-cols-[minmax(90px,.35fr)_1fr] gap-2"
          >
            <dt className="font-semibold opacity-70">{key}</dt>
            <dd className="break-all">{safeValue(key, item)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AuditTimeline({
  audits,
  title = "İşlem geçmişi",
  description = "Hassas alanlar varsayılan olarak maskelenir.",
  emptyLabel = "Bu kayda ait audit kaydı yok.",
}: {
  audits: AuditEntry[];
  title?: string;
  description?: string;
  emptyLabel?: string;
}) {
  return (
    <section className="mf-surface overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 p-5">
        <ShieldCheck className="text-primary-600" size={18} />
        <div>
          <h2 className="font-black text-ink">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {audits.length ? (
        <div className="divide-y divide-slate-100">
          {audits.map((audit) => (
            <article key={audit.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <strong className="text-ink">
                  {adminActionLabel(audit.action)}
                </strong>
                <span className="text-xs text-slate-500">
                  {new Date(audit.timestamp).toLocaleString("tr-TR")}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {adminEntityLabel(audit.entityType)} · {audit.actorId === "SYSTEM"
                  ? "Sistem işlemi"
                  : `İşlemi yapan kullanıcı #${audit.actorId}`}
                {audit.actorId !== "SYSTEM"
                  ? ` · Rol: ${audit.actorRole || "Bilinmiyor"}`
                  : ""}
                {audit.correlationId
                  ? ` · Correlation ID: ${audit.correlationId}`
                  : ""}
              </p>
              {audit.oldValue && (
                <AuditValue label="Eski değer" value={audit.oldValue} />
              )}
              {audit.newValue && (
                <AuditValue
                  label="Yeni değer / gerekçe"
                  value={audit.newValue}
                  tone="primary"
                />
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="p-5 text-sm text-slate-500">{emptyLabel}</p>
      )}
    </section>
  );
}
