import type { ReactNode } from "react";

import PageHeader from "@/components/ui/PageHeader";

type ListPageLayoutProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  count?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
};

/** Ortak başlık, filtre ve sayfalama hiyerarşisine sahip liste ekranları. */
export default function ListPageLayout({
  title,
  description,
  eyebrow,
  count,
  actions,
  filters,
  children,
  pagination,
}: ListPageLayoutProps) {
  return (
    <div className="mf-page">
      <PageHeader
        title={title}
        description={description}
        eyebrow={eyebrow}
        actions={actions}
      />
      {(count || filters) && (
        <section
          className="mf-surface flex flex-wrap items-center justify-between gap-3 p-4"
          aria-label={`${title} filtreleri`}
        >
          {count && (
            <p className="text-sm font-semibold text-slate-600">{count}</p>
          )}
          {filters && (
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {filters}
            </div>
          )}
        </section>
      )}
      {children}
      {pagination && (
        <nav className="flex justify-end" aria-label="Sayfalama">
          {pagination}
        </nav>
      )}
    </div>
  );
}
