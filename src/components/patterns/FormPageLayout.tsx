import type { ReactNode } from "react";

import PageHeader from "@/components/ui/PageHeader";

type FormSection = { title: string; description?: string; content: ReactNode };
type FormPageLayoutProps = {
  title: string;
  description?: string;
  backTo?: string;
  sections: FormSection[];
  saveBar?: ReactNode;
};

/** Bölümlü form ve mobilde de erişilebilir sabit kaydetme alanı. */
export default function FormPageLayout({
  title,
  description,
  backTo,
  sections,
  saveBar,
}: FormPageLayoutProps) {
  return (
    <div className="mf-page pb-24">
      <PageHeader title={title} description={description} backTo={backTo} />
      <div className="space-y-5">
        {sections.map((section) => (
          <section key={section.title} className="mf-surface p-5 sm:p-6">
            <h2 className="mf-section-title">{section.title}</h2>
            {section.description && (
              <p className="mf-muted mt-1">{section.description}</p>
            )}
            <div className="mt-5">{section.content}</div>
          </section>
        ))}
      </div>
      {saveBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6e1d8] bg-[#fffefa]/95 p-3 shadow-floating backdrop-blur sm:left-auto sm:right-6 sm:bottom-6 sm:w-auto sm:rounded-xl sm:border">
          {saveBar}
        </div>
      )}
    </div>
  );
}
