import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: "primary" | "success" | "warning" | "danger";
  detail?: string;
  delta?: number;
  to?: string;
};
const toneClasses = {
  primary: "bg-primary-50 text-primary-600",
  success: "bg-[#f2f2f2] text-[#191919]",
  warning: "bg-[#fff5db] text-warning-700",
  danger: "bg-[#fff1ef] text-primary-600",
};

export default function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  detail,
  delta,
  to,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${toneClasses[tone]}`}
        >
          {icon}
        </div>
        {to && <ArrowUpRight className="h-5 w-5 text-slate-300" />}
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
      {delta !== undefined && (
        <p
          className={`mt-2 text-xs font-semibold ${delta > 0 ? "text-danger-600" : delta < 0 ? "text-success-700" : "text-slate-500"}`}
        >
          {delta > 0
            ? `Önceki döneme göre +${delta}`
            : delta < 0
              ? `Önceki döneme göre ${delta}`
              : "Önceki dönemle aynı"}
        </p>
      )}
      {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
    </>
  );
  return to ? (
    <Link
      to={to}
      className="mf-surface block p-5 transition hover:border-[#c9c9c9] hover:shadow-card"
    >
      {content}
    </Link>
  ) : (
    <div className="mf-surface p-5">{content}</div>
  );
}
