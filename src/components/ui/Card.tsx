import type { HTMLAttributes, ReactNode } from "react";
export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section className={`mf-surface p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </section>
  );
}
export function AlertCard({
  title,
  children,
  tone = "info",
  className = "",
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
  className?: string;
}) {
  const styles = {
    info: "border-primary-200 bg-primary-50 text-primary-800",
    success: "border-success-100 bg-success-50 text-success-700",
    warning: "border-warning-100 bg-warning-50 text-warning-700",
    danger: "border-danger-100 bg-danger-50 text-danger-700",
  };
  return (
    <section className={`rounded-2xl border p-4 ${styles[tone]} ${className}`}>
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-1 text-sm leading-6">{children}</div>
    </section>
  );
}
export function ActionCard({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex flex-wrap items-center gap-4">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </Card>
  );
}
