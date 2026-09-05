import { Ban, RotateCcw, TicketPercent, Truck } from "lucide-react";

export const resolutions = [
  {
    value: "NO_COMPENSATION",
    label: "Telafisiz çözüm",
    description: "Finansal telafi gerekmeyen kararlar için.",
    icon: Ban,
  },
  {
    value: "FULL_REFUND",
    label: "Tam iade",
    description: "Ödemenin tamamı müşteriye geri ödenir.",
    icon: RotateCcw,
  },
  {
    value: "PARTIAL_REFUND",
    label: "Kısmi iade",
    description: "Belirlenen tutar müşteriye geri ödenir.",
    icon: RotateCcw,
  },
  {
    value: "COUPON",
    label: "Kişiye özel kupon",
    description: "Müşteriye özel indirim kuponu tanımlanır.",
    icon: TicketPercent,
  },
  {
    value: "MAKEUP_DELIVERY",
    label: "Telafi teslimatı",
    description: "Yeni bir teslimat tarihi planlanır.",
    icon: Truck,
  },
] as const;
