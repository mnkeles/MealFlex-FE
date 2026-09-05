import { useContext } from "react";
import { ToastContext } from "./toastContext";

/** Toast bildirimlerini uygulama kabuğu içindeki herhangi bir bileşenden tetikler. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error("useToast, ToastProvider içinde kullanılmalıdır.");
  return context;
}
