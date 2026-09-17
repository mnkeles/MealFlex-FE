import { useEffect, useRef, useState } from "react";
import { accountService } from "@/services/accountService";

export type SensitiveActionCredentials = {
  reason: string;
  reauthToken: string;
};

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  impactItems?: string[];
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (credentials: SensitiveActionCredentials) => void;
};

export default function AdminSensitiveActionDialog({
  open,
  title,
  description,
  confirmLabel,
  impactItems = [],
  pending,
  onCancel,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [impactAccepted, setImpactAccepted] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setReason("");
    setPassword("");
    setError("");
    setImpactAccepted(false);
    window.setTimeout(() => passwordRef.current?.focus(), 0);
    return () => openerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, pending, onCancel]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 3) {
      setError("Lütfen en az 3 karakterlik bir işlem gerekçesi yazın.");
      return;
    }
    try {
      const reauthToken = await accountService.reauthenticate(password);
      onConfirm({ reason: reason.trim(), reauthToken });
    } catch {
      setError("Parola doğrulanamadı. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="presentation"
    >
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-floating"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sensitive-action-title"
      >
        <h2
          id="sensitive-action-title"
          className="text-lg font-bold text-slate-900"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        {impactItems.length > 0 && (
          <div className="mt-4 rounded-xl border border-warning-200 bg-warning-50 p-4">
            <p className="text-sm font-semibold text-warning-900">İşlem etkisi</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-warning-800">
              {impactItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <label className="mt-3 flex items-start gap-2 text-sm font-semibold text-warning-900">
              <input type="checkbox" checked={impactAccepted} onChange={(event) => setImpactAccepted(event.target.checked)} className="mt-1" />
              Bu etkileri okudum ve işlemi bilinçli olarak onaylıyorum.
            </label>
          </div>
        )}
        <label
          className="mt-5 block text-sm font-medium text-slate-800"
          htmlFor="admin-action-reason"
        >
          İşlem gerekçesi
        </label>
        <textarea
          id="admin-action-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          required
          className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3"
        />
        <label
          className="mt-4 block text-sm font-medium text-slate-800"
          htmlFor="admin-action-password"
        >
          Parolanız
        </label>
        <input
          ref={passwordRef}
          id="admin-action-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
        />
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={pending || (impactItems.length > 0 && !impactAccepted)}
            className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "İşleniyor…" : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
