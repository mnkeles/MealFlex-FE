import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type SettingsNavItem = { label: string; to: string; icon?: ReactNode };
type SettingsLayoutProps = {
  title: string;
  description?: string;
  items: SettingsNavItem[];
  children: ReactNode;
};

/** Masaüstünde yan menü, mobilde yatay seçim alanı kullanan ayarlar şablonu. */
export default function SettingsLayout({
  title,
  description,
  items,
  children,
}: SettingsLayoutProps) {
  return (
    <div className="mf-page">
      <div>
        <h1 className="mf-page-title">{title}</h1>
        {description && <p className="mf-muted mt-2">{description}</p>}
      </div>
      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav
          className="mf-surface flex gap-1 overflow-x-auto p-2 lg:block"
          aria-label={`${title} bölümleri`}
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-[#f2f2f2] hover:text-ink"}`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
