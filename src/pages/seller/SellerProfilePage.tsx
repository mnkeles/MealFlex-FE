import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import { parseApiError } from "@/utils/apiErrors";

export default function SellerProfilePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    companyTitle: "",
    taxNumber: "",
    taxOffice: "",
    authorizedPerson: "",
    phone: "",
    bankName: "",
    iban: "",
  });
  const [formError, setFormError] = useState("");

  const { data: exists } = useQuery({
    queryKey: ["seller-profile-exists"],
    queryFn: sellerService.profileExists,
  });

  const { data: profile } = useQuery({
    queryKey: ["seller-profile"],
    queryFn: sellerService.getProfile,
    enabled: exists === true,
    retry: false,
  });

  const {
    data: banks = [],
    isLoading: banksLoading,
    isError: banksError,
  } = useQuery({
    queryKey: ["seller-bank-catalog"],
    queryFn: sellerService.getBanks,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        companyTitle: profile.companyTitle || "",
        taxNumber: profile.taxNumber || "",
        taxOffice: profile.taxOffice || "",
        authorizedPerson: profile.authorizedPerson || "",
        phone: profile.phone || "",
        bankName: profile.bankName || "",
        iban: profile.iban || "",
      });
    }
  }, [profile]);

  const createMutation = useMutation({
    mutationFn: sellerService.createProfile,
    onSuccess: () => {
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
      queryClient.invalidateQueries({ queryKey: ["seller-profile-exists"] });
    },
    onError: (error: unknown) =>
      setFormError(parseApiError(error, "Profil kaydedilemedi.").message),
  });

  const updateMutation = useMutation({
    mutationFn: sellerService.updateProfile,
    onSuccess: () => {
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["seller-profile"] });
    },
    onError: (error: unknown) =>
      setFormError(parseApiError(error, "Profil güncellenemedi.").message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      updateMutation.mutate({
        companyTitle: form.companyTitle,
        authorizedPerson: form.authorizedPerson,
        phone: form.phone || undefined,
        bankName: form.bankName || undefined,
        iban: form.iban || undefined,
      });
    } else {
      createMutation.mutate({
        companyTitle: form.companyTitle,
        taxNumber: form.taxNumber,
        taxOffice: form.taxOffice,
        authorizedPerson: form.authorizedPerson,
        phone: form.phone || undefined,
        bankName: form.bankName || undefined,
        iban: form.iban || undefined,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const selectedBankIsInCatalog = banks.some(
    (bank) => bank.name === form.bankName,
  );

  return (
    <div className="mf-page">
      <div className="border-b border-[#e7e7e7] pb-5">
        <p className="customer-eyebrow">Kurumsal bilgiler</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Satıcı profili</h1>
        <p className="mt-1 text-sm text-slate-500">Firma, yetkili ve ödeme aktarım bilgilerinizi güncel tutun.</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="mf-surface p-6 max-w-2xl"
      >
        {formError && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            {formError}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Firma Unvanı *
            </label>
            <input
              type="text"
              value={form.companyTitle}
              onChange={(e) =>
                setForm({ ...form, companyTitle: e.target.value })
              }
              className="mf-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Yetkili Kişi *
            </label>
            <input
              type="text"
              value={form.authorizedPerson}
              onChange={(e) =>
                setForm({ ...form, authorizedPerson: e.target.value })
              }
              className="mf-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Vergi Numarası *
              {profile && (
                <span className="ml-1 text-xs text-slate-400">
                  (değiştirilemez)
                </span>
              )}
            </label>
            <input
              type="text"
              value={form.taxNumber}
              onChange={
                profile
                  ? undefined
                  : (e) => setForm({ ...form, taxNumber: e.target.value })
              }
              readOnly={!!profile}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${profile ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
              required={!profile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Vergi Dairesi *
              {profile && (
                <span className="ml-1 text-xs text-slate-400">
                  (değiştirilemez)
                </span>
              )}
            </label>
            <input
              type="text"
              value={form.taxOffice}
              onChange={
                profile
                  ? undefined
                  : (e) => setForm({ ...form, taxOffice: e.target.value })
              }
              readOnly={!!profile}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${profile ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
              required={!profile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Telefon
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mf-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Banka Adı
            </label>
            <select
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              required={Boolean(form.iban)}
              disabled={banksLoading || banksError}
              className="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-100"
            >
              <option value="">
                {banksLoading ? "Bankalar yükleniyor..." : "Banka seçin"}
              </option>
              {form.bankName && !selectedBankIsInCatalog && (
                <option value={form.bankName} disabled>
                  Mevcut kayıt: {form.bankName} (yeniden seçin)
                </option>
              )}
              {banks.map((bank) => (
                <option key={bank.id} value={bank.name}>
                  {bank.name} — {bank.bankType === "KATILIM" ? "Katılım" : "Mevduat"}
                </option>
              ))}
            </select>
            {banksError && (
              <p className="mt-1 text-xs text-danger-600">
                Banka listesi yüklenemedi. Lütfen sayfayı yenileyin.
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              IBAN
            </label>
            <input
              type="text"
              value={form.iban}
              onChange={(e) =>
                {
                  const value = e.target.value
                    .replace(/\s/g, "")
                    .toUpperCase();
                  setForm({
                    ...form,
                    iban: value && !value.startsWith("TR")
                      ? `TR${value.replace(/^T/, "")}`
                      : value,
                  });
                }
              }
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              inputMode="numeric"
              maxLength={26}
              pattern="TR[0-9]{24}"
              required={Boolean(form.bankName)}
              className="mf-input"
            />
            <p className="mt-1 text-xs text-slate-500">
              Türkiye IBAN'ı, boşluksuz 26 karakter olarak kaydedilir.
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending
            ? "Kaydediliyor..."
            : profile
              ? "Güncelle"
              : "Profil Oluştur"}
        </button>
      </form>
    </div>
  );
}
