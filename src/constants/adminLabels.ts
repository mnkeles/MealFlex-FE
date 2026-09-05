const actionLabels: Record<string, string> = {
  ADMIN_USER_ACTIVATED: "Kullanıcı hesabı etkinleştirildi",
  ADMIN_USER_DEACTIVATED: "Kullanıcı hesabı pasifleştirildi",
  ADMIN_STORE_APPROVED: "Mağaza onaylandı",
  ADMIN_STORE_REJECTED: "Mağaza reddedildi",
  ADMIN_STORE_SUSPENDED: "Mağaza askıya alındı",
  ADMIN_COMPLAINT_UPDATED: "Şikâyet inceleme durumu güncellendi",
  ADMIN_COMPLAINT_RESOLVED: "Şikâyet sonuçlandırıldı",
  ADMIN_PAYMENT_REFUND: "Ödeme iadesi başlatıldı",
  ADMIN_SUBSCRIPTION_CANCELLED: "Abonelik iptal edildi",
  ADMIN_SUBSCRIPTION_NOTE: "Aboneliğe yönetici notu eklendi",
  ADMIN_DELIVERY_CORRECTED: "Teslimat bilgisi düzeltildi",
  RISK_CASE_ACKNOWLEDGED: "Risk kaydı işleme alındı",
  RISK_CASE_DISMISSED: "Risk kaydı kapatıldı",
  RISK_CASE_REOPENED: "Risk kararı geri alındı",
};

const entityLabels: Record<string, string> = {
  USER: "Kullanıcı",
  STORE: "Mağaza",
  SUBSCRIPTION: "Abonelik",
  DELIVERY: "Teslimat",
  PAYMENT: "Ödeme",
  COMPLAINT: "Şikâyet",
  RISK_CASE: "Risk kaydı",
  SELLER_DOCUMENT: "Satıcı belgesi",
  FINANCE_RECONCILIATION: "Mutabakat",
};

export const adminActionLabel = (value: string) =>
  actionLabels[value] ||
  value
    .toLocaleLowerCase("tr-TR")
    .split("_")
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");

export const adminEntityLabel = (value: string) =>
  entityLabels[value] || value;

export const auditEntityOptions = Object.entries(entityLabels).map(
  ([value, label]) => ({ value, label }),
);
