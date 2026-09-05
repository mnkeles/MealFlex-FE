import type { ReactNode } from "react";
type Tab = {
  value: string;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
};
export default function Tabs({
  tabs,
  value,
  onChange,
  label = "Bölüm seçimi",
}: {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex max-w-full gap-1 overflow-x-auto border-b border-slate-200"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          disabled={tab.disabled}
          onClick={() => onChange(tab.value)}
          className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold transition ${value === tab.value ? "border-primary-600 text-primary-700" : "border-transparent text-slate-500 hover:text-ink"}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
