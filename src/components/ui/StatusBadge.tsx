import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Info, Ban } from "lucide-react";
import {
  complaintStatuses,
  deliveryStatuses,
  documentStatuses,
  paymentStatuses,
  storeStatuses,
  subscriptionStatuses,
  uiStatus,
} from "@/constants/statuses";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";
type StatusDomain =
  | "subscription"
  | "delivery"
  | "payment"
  | "complaint"
  | "store"
  | "document";
type StatusBadgeProps = {
  children?: ReactNode;
  tone?: Tone;
  className?: string;
  status?: string | null;
  domain?: StatusDomain;
};

const tones: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-primary-50 text-primary-700",
};

const domains = {
  subscription: subscriptionStatuses,
  delivery: deliveryStatuses,
  payment: paymentStatuses,
  complaint: complaintStatuses,
  store: storeStatuses,
  document: documentStatuses,
};
const icons = {
  clock: Clock3,
  check: CheckCircle2,
  alert: AlertTriangle,
  info: Info,
  ban: Ban,
};

export default function StatusBadge({
  children,
  tone = "neutral",
  className = "",
  status,
  domain,
}: StatusBadgeProps) {
  const definition =
    status && domain ? uiStatus(domains[domain], status) : undefined;
  const Icon = definition ? icons[definition.icon] : undefined;
  return (
    <span
      title={definition?.description}
      className={`inline-flex items-center gap-1 rounded-md border border-current/10 px-2 py-1 text-[11px] font-semibold ${tones[definition?.tone || tone]} ${className}`}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {definition?.label || children}
    </span>
  );
}
