import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Onayla",
  danger = false,
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const openerRef = useRef<HTMLElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    window.setTimeout(() => confirmRef.current?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      openerRef.current?.focus();
    };
  }, [open, pending, onClose]);
  if (!open) return null;
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])",
      ) || [],
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        ref={dialogRef}
        onKeyDown={onKeyDown}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-floating"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title" className="text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600"
          >
            Vazgeç
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${danger ? "bg-danger-600" : "bg-primary-600"}`}
          >
            {pending ? "İşleniyor..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
