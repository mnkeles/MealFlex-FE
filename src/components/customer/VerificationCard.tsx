import { useEffect, useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

type VerificationCardProps = {
  icon: ReactNode;
  label: string;
  verified: boolean;
  disabledReason?: string;
  onRequest: () => void;
  onVerify: (code: string) => void;
  requestPending?: boolean;
  verifyPending?: boolean;
  requestLabel?: string;
  codePlaceholder?: string;
  initialCode?: string;
};

export default function VerificationCard({
  icon,
  label,
  verified,
  disabledReason,
  onRequest,
  onVerify,
  requestPending,
  verifyPending,
  requestLabel = "Kod gönder",
  codePlaceholder = "Doğrulama kodu",
  initialCode = "",
}: VerificationCardProps) {
  const [code, setCode] = useState(initialCode);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setSent(true);
    }
  }, [initialCode]);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <strong className="flex items-center gap-2">
          {icon}
          {label}
        </strong>
        <span
          className={`text-xs font-bold ${verified ? "text-success-700" : "text-warning-700"}`}
        >
          {verified ? "Doğrulandı" : "Bekliyor"}
        </span>
      </div>
      {!verified && (
        <>
          {disabledReason ? (
            <p className="mt-3 text-xs text-slate-500">{disabledReason}</p>
          ) : (
            <>
              <Button
                onClick={() => {
                  onRequest();
                  setSent(true);
                }}
                disabled={requestPending}
                size="sm"
                variant="secondary"
                className="mt-3"
              >
                {requestPending ? "Gönderiliyor…" : requestLabel}
              </Button>
              {sent && (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <FormField
                      label={codePlaceholder}
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                  <Button
                    disabled={!code.trim() || verifyPending}
                    onClick={() => onVerify(code)}
                    size="sm"
                  >
                    {verifyPending ? "Doğrulanıyor…" : "Doğrula"}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
