import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`mf-surface flex min-h-56 flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#f3e9df] text-primary-700">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
