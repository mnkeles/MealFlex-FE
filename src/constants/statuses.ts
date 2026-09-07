export type UiStatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type UiStatus = {
  label: string;
  tone: UiStatusTone;
  description: string;
  icon: "clock" | "check" | "alert" | "info" | "ban";
};

const toneIcons: Record<UiStatusTone, UiStatus["icon"]> = {
  neutral: "info",
  success: "check",
  warning: "alert",
  danger: "ban",
  info: "clock",
};
const status = (
  label: string,
  tone: UiStatusTone,
  description: string,
): UiStatus => ({ label, tone, description, icon: toneIcons[tone] });

export const subscriptionStatuses: Record<string, UiStatus> = {
  PENDING_APPROVAL: status(
    "Onay bekliyor",
    "warning",
    "Satıcının kararı bekleniyor.",
  ),
  APPROVED: status("Onaylandı", "info", "İlk teslimat için hazırlanıyor."),
  ACTIVE: status("Devam ediyor", "success", "Abonelik aktif."),
  PAYMENT_SUSPENDED: status(
    "Ödeme bekleniyor",
    "danger",
    "Haftalık ödeme tamamlanana kadar teslimatlar beklemede.",
  ),
  POSTPONED: status("Ertelendi", "warning", "Teslimat planı ertelendi."),
  COMPLETED: status("Tamamlandı", "neutral", "Abonelik süresi tamamlandı."),
  CANCELLED: status("İptal edildi", "danger", "Abonelik sonlandırıldı."),
  REJECTED: status(
    "Reddedildi",
    "danger",
    "Talep satıcı tarafından reddedildi.",
  ),
};

export const deliveryStatuses: Record<string, UiStatus> = {
  SCHEDULED: status("Planlandı", "info", "Teslimat sırasını bekliyor."),
  PREPARING: status(
    "Hazırlanıyor",
    "warning",
    "Sipariş mutfakta hazırlanıyor.",
  ),
  IN_TRANSIT: status("Yolda", "info", "Kurye teslimata çıktı."),
  DELIVERY_ATTEMPTED: status(
    "Teslim edilemedi",
    "warning",
    "Teslimat için yeniden işlem gerekiyor.",
  ),
  DELIVERED: status("Teslim edildi", "success", "Teslimat tamamlandı."),
  FAILED: status("Başarısız", "danger", "Teslimat tamamlanamadı."),
  SKIPPED: status("Atlandı", "neutral", "Teslimat günü atlandı."),
  CANCELLED: status("İptal edildi", "neutral", "Teslimat iptal edildi."),
};

export const paymentStatuses: Record<string, UiStatus> = {
  PENDING: status(
    "Ödeme bekleniyor",
    "warning",
    "Ödeme sağlayıcısının yanıtı bekleniyor.",
  ),
  PROCESSING: status("İşleniyor", "info", "Ödeme işleme alındı."),
  SUCCEEDED: status("Başarılı", "success", "Ödeme alındı."),
  FAILED: status("Başarısız", "danger", "Ödeme alınamadı."),
  PARTIALLY_REFUNDED: status(
    "Kısmi iade",
    "warning",
    "Ödemenin bir bölümü iade edildi.",
  ),
  REFUNDED: status("İade edildi", "neutral", "Ödeme tamamen iade edildi."),
};

export const complaintStatuses: Record<string, UiStatus> = {
  OPEN: status("Yeni", "warning", "Talep ilk incelemeyi bekliyor."),
  IN_REVIEW: status("İnceleniyor", "info", "Talep değerlendirme sürecinde."),
  RESOLVED: status("Çözüldü", "success", "Karar uygulandı."),
  CLOSED: status("Kapatıldı", "neutral", "Talep kapatıldı."),
};

export const storeStatuses: Record<string, UiStatus> = {
  DRAFT: status("Taslak", "neutral", "Mağaza henüz yayına hazır değil."),
  PENDING_APPROVAL: status(
    "Onay bekliyor",
    "warning",
    "Yayın için inceleme bekleniyor.",
  ),
  ACTIVE: status("Aktif", "success", "Mağaza müşterilere açık."),
  SUSPENDED: status("Askıda", "warning", "Mağaza geçici olarak kapalı."),
  REJECTED: status("Reddedildi", "danger", "Yayın başvurusu reddedildi."),
};

export const documentStatuses: Record<string, UiStatus> = {
  PENDING: status(
    "Onay bekliyor",
    "warning",
    "Belge inceleme sırasını bekliyor.",
  ),
  VERIFIED: status("Onaylandı", "success", "Belge doğrulandı."),
  REJECTED: status("Reddedildi", "danger", "Belge yeniden yüklenmeli."),
  EXPIRED: status("Süresi doldu", "danger", "Yeni belge yüklenmeli."),
};

/** Bilinmeyen yeni enum değerleri de teknik kod yerine anlaşılır bir varsayılanla gösterilir. */
export function uiStatus(
  statuses: Record<string, UiStatus>,
  value?: string | null,
): UiStatus {
  return (
    (value && statuses[value]) ||
    status(
      "Bilinmeyen durum",
      "neutral",
      "Bu kayıt için durum bilgisi henüz tanımlanmadı.",
    )
  );
}
