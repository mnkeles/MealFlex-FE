import type { ReactNode } from "react";

import Breadcrumb from "@/components/ui/Breadcrumb";
import PageHeader from "@/components/ui/PageHeader";

type DetailPageLayoutProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbItems?: { label: string; to?: string }[];
  status?: ReactNode;
  actions?: ReactNode;
  summary?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
};

/** Durum, özet ve sekme taşıyan kayıt detaylarının ortak iskeleti. */
export default function DetailPageLayout({
  title,
  description,
  eyebrow,
  breadcrumbItems,
  status,
  actions,
  summary,
  tabs,
  children,
}: DetailPageLayoutProps) {
  return (
    <div className="mf-page">
      {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
      <PageHeader
        title={title}
        description={description}
        eyebrow={eyebrow}
        actions={actions}
      >
        {status && <div className="mt-3">{status}</div>}
      </PageHeader>
      {summary}
      {tabs}
      {children}
    </div>
  );
}
