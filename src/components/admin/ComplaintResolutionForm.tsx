import { ReceiptText } from "lucide-react";
import Button from "@/components/ui/Button";
import { resolutions } from "@/constants/complaintResolutions";

export type ResolutionState = {
  resolutionType: string;
  reason: string;
  customerMessage: string;
  internalNote: string;
  amount: string;
  compensationDate: string;
};

type Props = {
  resolution: ResolutionState;
  setResolution: (value: ResolutionState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  pending: boolean;
};

export default function ComplaintResolutionForm({
  resolution,
  setResolution,
  onSubmit,
  onCancel,
  pending,
}: Props) {
  const needsAmount = ["PARTIAL_REFUND", "COUPON"].includes(
    resolution.resolutionType,
  );
  const needsDate = resolution.resolutionType === "MAKEUP_DELIVERY";
  const complete =
    !resolution.reason.trim() ||
    !resolution.customerMessage.trim() ||
    (needsAmount && !resolution.amount) ||
    (needsDate && !resolution.compensationDate) ||
    pending;
  const financialImpact = resolution.amount ? Number(resolution.amount) : 0;

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <div className="flex items-center gap-2">
        <ReceiptText size={18} className="text-primary-600" />
        <h3 className="font-black">Nihai karar ve telafi</h3>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {resolutions.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() =>
              setResolution({ ...resolution, resolutionType: item.value })
            }
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${resolution.resolutionType === item.value ? "border-primary-400 bg-primary-50" : "border-slate-200 bg-white hover:border-primary-200"}`}
          >
            <item.icon
              className={`mt-0.5 h-5 w-5 shrink-0 ${resolution.resolutionType === item.value ? "text-primary-600" : "text-slate-400"}`}
            />
            <span>
              <span className="block text-sm font-bold text-ink">
                {item.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {needsAmount && (
          <label className="mf-label">
            Tutar
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={resolution.amount}
              onChange={(e) =>
                setResolution({ ...resolution, amount: e.target.value })
              }
              className="mf-input mt-2 w-full"
            />
          </label>
        )}
        {needsDate && (
          <label className="mf-label">
            Telafi tarihi
            <input
              type="date"
              value={resolution.compensationDate}
              onChange={(e) =>
                setResolution({
                  ...resolution,
                  compensationDate: e.target.value,
                })
              }
              className="mf-input mt-2 w-full"
            />
          </label>
        )}
      </div>

      {["FULL_REFUND", "PARTIAL_REFUND", "COUPON"].includes(
        resolution.resolutionType,
      ) && (
        <p className="mt-4 rounded-xl bg-warning-50 p-4 text-sm text-warning-900">
          <strong>Finansal etki:</strong>{" "}
          {financialImpact > 0
            ? `${financialImpact.toLocaleString("tr-TR")} ₺ müşteri lehine telafi uygulanacak.`
            : "Tutarı girerek müşteri ve finans etkisini onaydan önce kontrol edin."}
        </p>
      )}

      <label className="mf-label mt-4 block">
        Karar gerekçesi
        <textarea
          value={resolution.reason}
          onChange={(e) =>
            setResolution({ ...resolution, reason: e.target.value })
          }
          rows={2}
          maxLength={500}
          className="mf-textarea mt-2 w-full"
        />
      </label>
      <label className="mf-label mt-4 block">
        Müşteriye gösterilecek mesaj
        <textarea
          value={resolution.customerMessage}
          onChange={(e) =>
            setResolution({ ...resolution, customerMessage: e.target.value })
          }
          rows={3}
          className="mf-textarea mt-2 w-full"
        />
      </label>
      <label className="mf-label mt-4 block">
        Yalnız adminlerin göreceği iç not
        <textarea
          value={resolution.internalNote}
          onChange={(e) =>
            setResolution({ ...resolution, internalNote: e.target.value })
          }
          rows={2}
          className="mf-textarea mt-2 w-full"
        />
      </label>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button onClick={onCancel} variant="ghost" size="sm">
          Vazgeç
        </Button>
        <Button
          onClick={onSubmit}
          disabled={complete}
          variant="danger"
          size="sm"
        >
          Kararı uygula
        </Button>
      </div>
    </div>
  );
}
