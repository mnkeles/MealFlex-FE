import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPinned, ShieldAlert } from "lucide-react";
import { adminService } from "@/services/adminService";
import AdminSensitiveActionDialog, {
  type SensitiveActionCredentials,
} from "@/components/admin/AdminSensitiveActionDialog";
import AuditTimeline from "@/components/admin/AuditTimeline";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function AdminStoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    minPersonCount: 0,
    maxPersonCount: 0,
  });
  const [sensitiveAction, setSensitiveAction] = useState<
    "approve" | "suspend" | "reject"
  >();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-store", id],
    queryFn: () => adminService.getStoreDetail(Number(id)),
    enabled: !!id,
  });
  const updateMutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) =>
      adminService.updateStore(Number(id), updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-store", id] });
      setEditing(false);
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({
      action,
      credentials,
    }: {
      action: "approve" | "suspend" | "reject";
      credentials: SensitiveActionCredentials;
    }) =>
      action === "approve"
        ? adminService.approveStore(Number(id), credentials)
        : action === "suspend"
          ? adminService.suspendStore(Number(id), credentials)
          : adminService.rejectStore(Number(id), credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-store", id] });
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
          title="Mağaza bulunamadı"
          description="Kayıt yüklenemedi veya erişilebilir değil."
          action={
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Tekrar dene
            </Button>
          }
        />
      </div>
    );
  const { store, serviceAreas, subscriptions, complaints, audits } = data;
  const startEditing = () => {
    setForm({
      name: store.name,
      description: store.description || "",
      minPersonCount: store.minPersonCount,
      maxPersonCount: store.maxPersonCount || 0,
    });
    setEditing(true);
  };
  const info = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col justify-between gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
  return (
    <div className="mf-page space-y-6">
      <PageHeader
        backTo="/admin/stores"
        backLabel="Mağaza listesi"
        eyebrow="Mağaza yönetimi"
        title={store.name}
        description="Mağaza durumu, hizmet alanı ve ilişkili operasyon kayıtları."
        actions={
          <>
            <StatusBadge domain="store" status={store.status} />
            {!editing && (
              <Button onClick={startEditing} variant="outline" size="sm">
                Düzenle
              </Button>
            )}
            {store.status !== "ACTIVE" && (
              <Button onClick={() => setSensitiveAction("approve")} size="sm">
                Onayla
              </Button>
            )}
            {store.status === "ACTIVE" && (
              <Button
                onClick={() => setSensitiveAction("suspend")}
                variant="outline"
                size="sm"
              >
                Askıya al
              </Button>
            )}
            {store.status !== "REJECTED" && (
              <Button
                onClick={() => setSensitiveAction("reject")}
                variant="danger"
                size="sm"
              >
                Reddet
              </Button>
            )}
          </>
        }
      />
      <AdminSensitiveActionDialog
        open={!!sensitiveAction}
        title={
          sensitiveAction === "approve"
            ? "Mağazayı onayla"
            : sensitiveAction === "suspend"
              ? "Mağazayı askıya al"
              : "Mağazayı reddet"
        }
        description="Bu kritik işlem için gerekçe ve parolanızla yeniden doğrulama gerekir."
        impactItems={
          sensitiveAction === "approve"
            ? ["Mağaza müşteriler tarafından görüntülenebilir hale gelir.", "Karar ve gerekçe audit kaydına eklenir."]
            : sensitiveAction === "suspend"
              ? ["Mağaza geçici olarak yeni talep alamaz.", "Mevcut operasyon kayıtları silinmez."]
              : ["Başvuru reddedilir ve yeniden inceleme için yeni işlem gerekir.", "Karar ve gerekçe audit kaydına eklenir."]
        }
        confirmLabel={
          sensitiveAction === "approve"
            ? "Onayla"
            : sensitiveAction === "suspend"
              ? "Askıya al"
              : "Reddet"
        }
        pending={statusMutation.isPending}
        onCancel={() => setSensitiveAction(undefined)}
        onConfirm={(credentials) =>
          sensitiveAction &&
          statusMutation.mutate({ action: sensitiveAction, credentials })
        }
      />
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="mf-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-primary-600" />
            <h2 className="font-black">Mağaza bilgileri</h2>
          </div>
          {editing ? (
            <div className="space-y-4">
              <label className="mf-label block">
                Mağaza adı
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mf-input mt-2 w-full"
                />
              </label>
              <label className="mf-label block">
                Açıklama
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="mf-textarea mt-2 w-full"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="mf-label">
                  Minimum kişi
                  <input
                    type="number"
                    value={form.minPersonCount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        minPersonCount: Number(e.target.value),
                      })
                    }
                    className="mf-input mt-2 w-full"
                  />
                </label>
                <label className="mf-label">
                  Maksimum kişi
                  <input
                    type="number"
                    value={form.maxPersonCount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxPersonCount: Number(e.target.value),
                      })
                    }
                    className="mf-input mt-2 w-full"
                  />
                </label>
              </div>
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
                  Mağaza bilgileri kaydedilemedi.
                </p>
              )}
            </div>
          ) : (
            <dl>
              {info("Açıklama", store.description || "—")}
              {info("Minimum kişi", store.minPersonCount)}
              {info("Maksimum kişi", store.maxPersonCount || "—")}
              {info(
                "Puan",
                `${store.rating} (${store.reviewCount} değerlendirme)`,
              )}
            </dl>
          )}
        </article>
        <article className="mf-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <MapPinned size={18} className="text-primary-600" />
            <h2 className="font-black">
              Hizmet bölgeleri ({serviceAreas.length})
            </h2>
          </div>
          {serviceAreas.length ? (
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map((area) => (
                <StatusBadge key={area.id} tone="info">
                  {area.city} / {area.district}
                </StatusBadge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Tanımlı hizmet bölgesi yok.
            </p>
          )}
        </article>
      </section>
      <section className="mf-surface overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-black">Abonelikler ({subscriptions.length})</h2>
        </div>
        {subscriptions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
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
        description="Bu mağaza üzerinde yapılan yönetim işlemleri."
        emptyLabel="Bu mağaza için audit kaydı yok."
      />
    </div>
  );
}
