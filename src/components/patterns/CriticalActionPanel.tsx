import type { ReactNode } from "react";

import { AlertTriangle } from "lucide-react";

type CriticalActionPanelProps = {
  title: string;
  description: string;
  impact: ReactNode;
  reason: ReactNode;
  confirmation: ReactNode;
};

/** Kritik işlemlerde gerekçe, etki özeti ve ikinci onayı yan yana tutar. */
export default function CriticalActionPanel({
  title,
  description,
  impact,
  reason,
  confirmation,
}: CriticalActionPanelProps) {
  return (
    <section className="rounded-mf-surface border border-danger-100 bg-danger-50/50 p-5">
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 shrink-0 text-danger-600"
          aria-hidden="true"
        />
        <div>
          <h2 className="font-semibold text-danger-700">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">{description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mf-label">Etkisi</p>
          {impact}
        </div>
        <div>
          <p className="mf-label">Gerekçe</p>
          {reason}
        </div>
      </div>
      <div className="mt-4 border-t border-danger-100 pt-4">{confirmation}</div>
    </section>
  );
}
