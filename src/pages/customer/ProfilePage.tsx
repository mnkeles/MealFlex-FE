import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CreditCard,
  Heart,
  LifeBuoy,
  MapPin,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { FormField, TextareaField } from "@/components/ui/FormField";
import PageHeader from "@/components/ui/PageHeader";
import { AlertCard, Card } from "@/components/ui/Card";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    taxNumber: "",
    taxOffice: "",
    invoiceAddress: "",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get("/v1/users/me")).data,
  });
  useUnsavedChanges(dirty);
  useEffect(() => {
    const profile = profileQuery.data;
    if (profile)
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        companyName: profile.companyName || "",
        taxNumber: profile.taxNumber || "",
        taxOffice: profile.taxOffice || "",
        invoiceAddress: profile.invoiceAddress || "",
      });
  }, [profileQuery.data]);
  const update = useMutation({
    mutationFn: async () => (await api.put("/v1/users/me", form)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setDirty(false);
    },
  });
  const changePassword = useMutation({
    mutationFn: () => api.post("/v1/auth/change-password", password),
    onSuccess: () => setPassword({ currentPassword: "", newPassword: "" }),
  });
  if (profileQuery.isLoading)
    return (
      <div className="mf-page">
        <div className="h-80 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  if (profileQuery.isError || !profileQuery.data)
    return (
      <div className="mf-page">
        <EmptyState
          title="Profil yüklenemedi"
          description="Bağlantıyı kontrol edip tekrar deneyin."
          action={
            <Button
              onClick={() => profileQuery.refetch()}
              variant="outline"
              size="sm"
            >
              Tekrar dene
            </Button>
          }
        />
      </div>
    );
  const profile = profileQuery.data;
  const links = [
    [MapPin, "Adreslerim", "/addresses"],
    [TicketCheck, "Aboneliklerim", "/subscriptions"],
    [Heart, "Favorilerim", "/favorites"],
    [Bell, "Bildirimler", "/notifications"],
    [CreditCard, "Ödeme yöntemleri", "/payment-methods"],
    [LifeBuoy, "Destek Merkezi", "/support"],
    [ShieldCheck, "Hesap ve güvenlik", "/security"],
  ];
  return (
    <div className="mf-page max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Hesabım"
        title="Profil ve ayarlar"
        description="Kişisel, fatura ve hesap güvenliği bilgilerinizi yönetin."
      />
      <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(([Icon, label, to]) => {
          const ItemIcon = Icon as typeof MapPin;
          return (
            <Link
              key={String(to)}
              to={String(to)}
              className="flex items-center gap-2 rounded-2xl border border-[#e7e7e7] bg-white p-3 text-sm font-bold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
            >
              <ItemIcon size={17} />
              {String(label)}
            </Link>
          );
        })}
      </nav>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate();
        }}
        className="space-y-5"
      >
        <Card>
          <h2 className="mf-section-title">Kişisel bilgiler</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Ad"
              required
              value={form.firstName}
              onChange={(e) => {
                setForm({ ...form, firstName: e.target.value });
                setDirty(true);
              }}
            />
            <FormField
              label="Soyad"
              required
              value={form.lastName}
              onChange={(e) => {
                setForm({ ...form, lastName: e.target.value });
                setDirty(true);
              }}
            />
            <FormField
              label="Telefon"
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: e.target.value });
                setDirty(true);
              }}
            />
            <FormField label="E-posta" value={profile.email || ""} disabled />
          </div>
        </Card>
        <Card>
          <h2 className="mf-section-title">Fatura bilgileri</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Firma adı"
              value={form.companyName}
              onChange={(e) => {
                setForm({ ...form, companyName: e.target.value });
                setDirty(true);
              }}
            />
            <FormField
              label="Vergi no"
              value={form.taxNumber}
              onChange={(e) => {
                setForm({ ...form, taxNumber: e.target.value });
                setDirty(true);
              }}
            />
            <FormField
              label="Vergi dairesi"
              value={form.taxOffice}
              onChange={(e) => {
                setForm({ ...form, taxOffice: e.target.value });
                setDirty(true);
              }}
            />
            <div />
          </div>
          <div className="mt-4">
            <TextareaField
              label="Fatura adresi"
              rows={3}
              value={form.invoiceAddress}
              onChange={(e) => {
                setForm({ ...form, invoiceAddress: e.target.value });
                setDirty(true);
              }}
            />
          </div>
        </Card>
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </Button>
        </div>
        {update.isSuccess && (
          <AlertCard tone="success" title="Profil güncellendi">
            Bilgileriniz başarıyla kaydedildi.
          </AlertCard>
        )}
        {update.isError && (
          <AlertCard tone="danger" title="Profil güncellenemedi">
            Alanları kontrol ederek tekrar deneyin.
          </AlertCard>
        )}
      </form>
      <Card>
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary-600" size={19} />
          <h2 className="mf-section-title">Şifre değiştir</h2>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            changePassword.mutate();
          }}
          className="mt-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Mevcut şifre"
              type="password"
              required
              value={password.currentPassword}
              onChange={(e) =>
                setPassword({ ...password, currentPassword: e.target.value })
              }
            />
            <FormField
              label="Yeni şifre"
              type="password"
              minLength={8}
              required
              hint="En az 8 karakter kullanın."
              value={password.newPassword}
              onChange={(e) =>
                setPassword({ ...password, newPassword: e.target.value })
              }
            />
          </div>
          <Button
            className="mt-4"
            type="submit"
            variant="secondary"
            disabled={changePassword.isPending}
          >
            Şifreyi güncelle
          </Button>
          {changePassword.isSuccess && (
            <p className="mt-3 text-sm font-semibold text-success-700">
              Şifreniz güncellendi.
            </p>
          )}
        </form>
      </Card>
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="mf-section-title">Hesap ve Güvenlik</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Doğrulamalarınızı, açık oturumlarınızı, bildirim tercihlerinizi ve
            kişisel veri işlemlerinizi ayrı güvenlik ekranından yönetin.
          </p>
        </div>
        <Link to="/security">
          <Button variant="outline">Güvenliği yönet</Button>
        </Link>
      </Card>
    </div>
  );
}
