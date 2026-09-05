import type { ReactNode } from "react";

import PageHeader from "@/components/ui/PageHeader";

type DashboardLayoutProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  kpis: ReactNode;
  alerts?: ReactNode;
  children: ReactNode;
};

/** KPI, kritik uyarı ve operasyon içeriğini tutarlı sırada gösterir. */
export default function DashboardLayout({
  title,
  description,
  actions,
  kpis,
  alerts,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="mf-page">
      <PageHeader title={title} description={description} actions={actions} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis}
      </section>
      {alerts}
      {children}
    </div>
  );
}
