import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, ShieldAlert, UserRound } from "lucide-react";
import { adminService } from "@/services/adminService";
import AdminSensitiveActionDialog, {
  type SensitiveActionCredentials,
} from "@/components/admin/AdminSensitiveActionDialog";
import AuditTimeline from "@/components/admin/AuditTimeline";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

const roleLabels: Record<string, string> = {
  CUSTOMER: "Müşteri",
  SELLER: "Satıcı",
  ADMIN: "Admin",
};
const roleTones: Record<string, "success" | "info" | "danger"> = {
  CUSTOMER: "success",
  SELLER: "info",
  ADMIN: "danger",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [sensitiveAction, setSensitiveAction] = useState<
    "activate" | "deactivate"
  >();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => adminService.getUserDetail(Number(id)),
    enabled: !!id,
  });
  const updateMutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) =>
      adminService.updateUser(Number(id), updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      setEditing(false);
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: (credentials: SensitiveActionCredentials) =>
      adminService.deactivateUser(Number(id), credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      setSensitiveAction(undefined);
    },
  });
  const activateMutation = useMutation({
    mutationFn: (credentials: SensitiveActionCredentials) =>
      adminService.activateUser(Number(id), credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      setSensitiveAction(undefined);
    },
  });
  if (isLoading)
    return (
      <div className="mf-page flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  if (isError || !data)
    return (
      <div className="mf-page">
        <EmptyState
          title="Kullanıcı bulunamadı"
          description="Kayıt yüklenemedi veya artık erişilebilir değil."
          action={
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Tekrar dene
            </Button>
          }
        />
      </div>
    );
  const {
    user,
    addresses,
    subscriptions,
    complaints,
    customerProfile,
    sellerProfile,
    audits,
  } = data;
  const startEditing = () => {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || "",
    });
    setEditing(true);
  };
  const infoRow = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col justify-between gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="break-all text-sm font-semibold text-ink">{value}</dd>
    </div>
  );

  return (
    <div className="mf-page space-y-6">
      <PageHeader
        backTo="/admin/users"
        backLabel="Kullanıcı listesi"
        eyebrow="Kullanıcı yönetimi"
        title={`${user.firstName} ${user.lastName}`}
        description={user.email}
        actions={
          <>
            <StatusBadge tone={roleTones[user.role] || "info"}>
              {roleLabels[user.role] || user.role}
            </StatusBadge>
            {!editing && (
              <Button onClick={startEditing} variant="outline" size="sm">
                Düzenle
              </Button>
            )}
            <Button
              onClick={() =>
                setSensitiveAction(user.active ? "deactivate" : "activate")
              }
              variant={user.active ? "danger" : "primary"}
              size="sm"
            >
              {user.active ? "Pasife al" : "Aktifleştir"}
            </Button>
          </>
        }
      />
      <AdminSensitiveActionDialog
        open={!!sensitiveAction}
        title={
          sensitiveAction === "deactivate"
            ? "Kullanıcıyı pasife al"
            : "Kullanıcıyı aktifleştir"
        }
        description="Bu kritik işlem için gerekçe ve parolanızla yeniden doğrulama gerekir."
        impactItems={
          sensitiveAction === "deactivate"
            ? ["Kullanıcının yeni oturum açması engellenir.", "Mevcut iş kayıtları ve audit geçmişi silinmez."]
            : ["Kullanıcı yeniden giriş yapabilir.", "Hesabın önceki audit geçmişi korunur."]
        }
        confirmLabel={
          sensitiveAction === "deactivate" ? "Pasife al" : "Aktifleştir"
        }
        pending={deactivateMutation.isPending || activateMutation.isPending}
        onCancel={() => setSensitiveAction(undefined)}
        onConfirm={(credentials) =>
          sensitiveAction === "deactivate"
            ? deactivateMutation.mutate(credentials)
            : activateMutation.mutate(credentials)
        }
      />
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="mf-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={18} className="text-primary-600" />
            <h2 className="font-black">Kullanıcı bilgileri</h2>
          </div>
          {editing ? (
            <div className="space-y-4">
              <label className="mf-label block">
                Ad
                <input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  className="mf-input mt-2 w-full"
                />
              </label>
              <label className="mf-label block">
                Soyad
                <input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  className="mf-input mt-2 w-full"
                />
              </label>
              <label className="mf-label block">
                Telefon
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mf-input mt-2 w-full"
                />
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={() => updateMutation.mutate(form)}
                  disabled={updateMutation.isPending}
                  size="sm"
                >
                  Kaydet
                </Button>
                <Button
                  onClick={() => setEditing(false)}
                  variant="ghost"
                  size="sm"
                >
                  İptal
                </Button>
              </div>
              {updateMutation.isError && (
                <p className="text-sm text-danger-600">
                  Kullanıcı bilgileri kaydedilemedi.
                </p>
              )}
            </div>
          ) : (
            <dl>
              {infoRow("E-posta", user.email)}
              {infoRow("Telefon", user.phone || "—")}
              {infoRow(
                "Durum",
                <StatusBadge tone={user.active ? "success" : "danger"}>
                  {user.active ? "Aktif" : "Pasif"}
                </StatusBadge>,
              )}
              {infoRow(
                "E-posta doğrulama",
                user.emailVerified ? "Doğrulanmış" : "Doğrulanmamış",
              )}
              {infoRow(
                "Kayıt tarihi",
                user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("tr-TR")
                  : "—",
              )}
            </dl>
          )}
        </article>
        {(customerProfile || sellerProfile) && (
          <article className="mf-surface p-6">
            <h2 className="font-black">
              {customerProfile ? "Müşteri profili" : "Satıcı profili"}
            </h2>
            <dl className="mt-4">
              {customerProfile && (
                <>
                  {infoRow("Firma adı", customerProfile.companyName || "—")}
                  {infoRow("Vergi no", customerProfile.taxNumber || "—")}
                  {infoRow("Vergi dairesi", customerProfile.taxOffice || "—")}
                  {infoRow(
                    "Fatura adresi",
                    customerProfile.invoiceAddress || "—",
                  )}
                </>
              )}
              {sellerProfile && (
                <>
                  {infoRow("Firma ünvanı", sellerProfile.companyTitle || "—")}
                  {infoRow("Vergi no", sellerProfile.taxNumber || "—")}
                  {infoRow(
                    "Yetkili kişi",
                    sellerProfile.authorizedPerson || "—",
                  )}
                  {infoRow("IBAN", sellerProfile.iban || "—")}
                </>
              )}
            </dl>
          </article>
        )}
      </section>
      <section className="mf-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-primary-600" />
          <h2 className="font-black">Adresler ({addresses.length})</h2>
        </div>
        {addresses.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {addresses.map((address) => (
              <article
                key={address.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <p className="font-bold">{address.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {address.city} / {address.district}
                </p>
                {address.fullAddress && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {address.fullAddress}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Kayıtlı adres bulunmuyor.</p>
        )}
      </section>
      <section className="mf-surface overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-black">
            İlişkili abonelikler ({subscriptions.length})
          </h2>
        </div>
        {subscriptions.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3">Başlangıç</th>
                  <th className="px-5 py-3">Bitiş</th>
                  <th className="px-5 py-3">Kişi</th>
                  <th className="px-5 py-3">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-5 py-3 font-bold">#{sub.id}</td>
                    <td className="px-5 py-3">
                      <StatusBadge domain="subscription" status={sub.status} />
                    </td>
                    <td className="px-5 py-3">{sub.startDate}</td>
                    <td className="px-5 py-3">{sub.endDate}</td>
                    <td className="px-5 py-3">{sub.personCount}</td>
                    <td className="px-5 py-3 font-semibold">
                      {sub.totalAmount?.toFixed(2)} ₺
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-sm text-slate-500">Abonelik bulunmuyor.</p>
        )}
      </section>
      <section className="mf-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert size={18} className="text-warning-600" />
          <h2 className="font-black">Şikâyetler ({complaints.length})</h2>
        </div>
        {complaints.length ? (
          <div className="space-y-3">
            {complaints.map((complaint) => (
              <article
                key={complaint.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{complaint.reason}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {complaint.description}
                    </p>
                  </div>
                  <StatusBadge domain="complaint" status={complaint.status} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Şikâyet bulunmuyor.</p>
        )}
      </section>
      <AuditTimeline
        audits={audits}
        title="Audit zaman çizelgesi"
        description="Bu kullanıcı üzerinde yapılan yönetim işlemleri."
        emptyLabel="Bu kullanıcı için audit kaydı yok."
      />
    </div>
  );
}
