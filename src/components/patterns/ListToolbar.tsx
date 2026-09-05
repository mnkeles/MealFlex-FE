import type { ReactNode } from "react";

type ListToolbarProps = {
  children: ReactNode;
  label?: string;
  className?: string;
};

export default function ListToolbar({
  children,
  label = "Liste araçları",
  className = "",
}: ListToolbarProps) {
  return (
    <section
      role="search"
      aria-label={label}
      className={`mf-surface flex flex-wrap items-center gap-2 p-3 ${className}`}
    >
      {children}
    </section>
  );
}
