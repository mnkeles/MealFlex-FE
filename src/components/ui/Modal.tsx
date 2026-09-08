import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  initialFocusSelector?: string;
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  initialFocusSelector,
}: ModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const dialogElement = dialogRef.current;
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const timer = window.setTimeout(
      () =>
        (
          (initialFocusSelector
            ? dialogElement?.querySelector<HTMLElement>(initialFocusSelector)
            : null) ||
          dialogElement?.querySelector<HTMLElement>(focusableSelector)
        )?.focus(),
      0,
    );
    return () => {
      window.clearTimeout(timer);
      const focusToRestore = previousFocus.current;
      window.setTimeout(() => {
        if (!dialogElement?.isConnected) focusToRestore?.focus();
      }, 0);
    };
  }, [open, initialFocusSelector]);

  if (!open) return null;

  const trapFocus = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || [],
    );
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
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
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        onKeyDown={trapFocus}
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 id="modal-title" className="font-black text-ink">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Pencereyi kapat"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </header>
        <div className="max-h-[calc(90vh-8.5rem)] overflow-y-auto p-5">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
