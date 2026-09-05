import { MessageSquareWarning } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { complaintStatuses, uiStatus } from "@/constants/statuses";
import type { AdminComplaint } from "@/services/adminService";

export default function ComplaintListCard({
  item,
  onOpen,
}: {
  item: AdminComplaint;
  onOpen: (item: AdminComplaint) => void;
}) {
  return (
    <button
      onClick={() => onOpen(item)}
      className="mf-surface p-5 text-left transition hover:border-primary-300"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <MessageSquareWarning size={18} className="text-primary-600" />
            <strong className="text-ink">
              #{item.id} · {item.reason}
            </strong>
            <StatusBadge tone={uiStatus(complaintStatuses, item.status).tone}>
              {uiStatus(complaintStatuses, item.status).label}
            </StatusBadge>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
            {item.description}
          </p>
        </div>
        {item.resolutionType && (
          <StatusBadge tone="success">Karar verildi</StatusBadge>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
        <span>
          {item.customer
            ? `${item.customer.firstName} ${item.customer.lastName}`
            : "Müşteri"}
        </span>
        <span>{item.store?.name || "Mağaza"}</span>
        {item.subscription && <span>Abonelik #{item.subscription.id}</span>}
        {item.delivery && <span>Teslimat #{item.delivery.id}</span>}
      </div>
    </button>
  );
}
