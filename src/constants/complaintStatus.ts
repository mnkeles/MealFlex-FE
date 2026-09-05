import { complaintStatuses } from "./statuses";

export type ComplaintStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";

const toneClasses = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-info-50 text-info-700",
};

export const complaintStatusConfig: Record<
  ComplaintStatus,
  { label: string; color: string }
> = Object.fromEntries(
  Object.entries(complaintStatuses).map(([key, value]) => [
    key,
    { label: value.label, color: toneClasses[value.tone] },
  ]),
) as Record<ComplaintStatus, { label: string; color: string }>;
