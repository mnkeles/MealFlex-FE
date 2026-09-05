import { useEffect } from "react";
export default function useUnsavedChanges(
  dirty: boolean,
  message = "Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istiyor musunuz?",
) {
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, message]);
}
