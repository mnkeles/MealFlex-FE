import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  Database,
  MailCheck,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import {
  accountService,
  type NotificationPreferences,
} from "@/services/accountService";
import { useAuth } from "@/contexts/AuthContext";
import VerificationCard from "@/components/customer/VerificationCard";

export default function AccountSecurityPanel({
  profile,
}: {
  profile: { emailVerified: boolean; phoneVerified: boolean; phone?: string };
}) {
  const client = useQueryClient();
  const { logout, user } = useAuth();
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [message, setMessage] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const { data: preferenceData } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: accountService.preferences,
  });
  const { data: consents = [] } = useQuery({
    queryKey: ["account-consents"],
    queryFn: accountService.consents,
  });
  const { data: dataRequests = [] } = useQuery({
    queryKey: ["data-requests"],
    queryFn: accountService.dataRequests,
  });
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    marketingEnabled: false,
  });
  useEffect(() => {
    if (preferenceData) setPreferences(preferenceData);
  }, [preferenceData]);
  const requestEmail = useMutation({
    mutationFn: accountService.requestEmail,
    onSuccess: (r) => {
      setMessage(r.message);
      if (r.developmentCode) setEmailCode(r.developmentCode);
    },
  });
  const verifyEmail = useMutation({
    mutationFn: (code: string) => accountService.verifyEmail(code),
    onSuccess: () => {
      setMessage("E-posta doğrulandı.");
      client.invalidateQueries({ queryKey: ["profile"] });
    },
  });
  const requestPhone = useMutation({
    mutationFn: accountService.requestPhone,
    onSuccess: (r) => {
      setMessage(r.message);
      if (r.developmentCode) setPhoneCode(r.developmentCode);
    },
  });
  const verifyPhone = useMutation({
    mutationFn: (code: string) => accountService.verifyPhone(code),
    onSuccess: () => {
      setMessage("Telefon doğrulandı.");
      client.invalidateQueries({ queryKey: ["profile"] });
    },
  });
  const savePreferences = useMutation({
    mutationFn: () => accountService.updatePreferences(preferences),
    onSuccess: (r) => {
      setPreferences(r);
      setMessage("Bildirim tercihleri kaydedildi.");
    },
  });
  const requestExport = useMutation({
    mutationFn: accountService.requestExport,
    onSuccess: () => {
      setMessage("Veri kopyanız hazırlandı.");
      client.invalidateQueries({ queryKey: ["data-requests"] });
    },
  });
  const deleteAccount = useMutation({
    mutationFn: async () => {
      const reauthToken = await accountService.reauthenticate(deletePassword);
      return accountService.deleteAccount(deleteText, reauthToken);
    },
    onSuccess: logout,
  });
  const download = async () => {
    const data = await accountService.exportData();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mealflex-verilerim.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const error = (
    deleteAccount.error as { response?: { data?: { message?: string } } } | null
  )?.response?.data?.message;
  return (
    <div className="mt-8 space-y-6">
      {message && (
        <p className="rounded-xl bg-success-50 p-3 text-sm font-semibold text-success-700">
          {message}
        </p>
      )}
      <section
        id="notification-preferences"
        className="scroll-mt-24 rounded-xl bg-white p-6 shadow-sm"
      >
        <h2 className="flex items-center gap-2 font-black">
          <ShieldCheck className="h-5 w-5 text-primary-600" />
          Hesap doğrulamaları
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <VerificationCard
            icon={<MailCheck className="h-5 w-5" />}
            label="E-posta"
            verified={profile.emailVerified}
            onRequest={() => requestEmail.mutate()}
            requestPending={requestEmail.isPending}
            onVerify={(code) => verifyEmail.mutate(code)}
            verifyPending={verifyEmail.isPending}
            initialCode={emailCode}
            codePlaceholder="Doğrulama kodu"
          />
          <VerificationCard
            icon={<Smartphone className="h-5 w-5" />}
            label="Telefon"
            verified={profile.phoneVerified}
            disabledReason={
              !profile.phone
                ? "Kod göndermek için önce profilinize telefon numarası ekleyin."
                : undefined
            }
            onRequest={() => requestPhone.mutate()}
            requestPending={requestPhone.isPending}
            onVerify={(code) => verifyPhone.mutate(code)}
            verifyPending={verifyPhone.isPending}
            initialCode={phoneCode}
            requestLabel="OTP gönder"
            codePlaceholder="6 haneli OTP"
          />
        </div>
      </section>
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-black">
          <BellRing className="h-5 w-5 text-primary-600" />
          Bildirim kanalları
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["emailEnabled", "E-posta"],
              ["smsEnabled", "SMS"],
              ["pushEnabled", "Uygulama bildirimi"],
              ["marketingEnabled", "Kampanya ve pazarlama"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold"
            >
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={(e) =>
                  setPreferences({ ...preferences, [key]: e.target.checked })
                }
              />
              {label}
            </label>
          ))}
        </div>
        <button
          onClick={() => savePreferences.mutate()}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white"
        >
          Tercihleri kaydet
        </button>
      </section>
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-black">
          <Database className="h-5 w-5 text-primary-600" />
          Verilerim ve sözleşmeler
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => requestExport.mutate()}
            className="rounded-lg border px-4 py-2 text-sm font-bold"
          >
            Veri kopyası talep et
          </button>
          <button
            onClick={download}
            disabled={!dataRequests.some((r) => r.status === "READY")}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            JSON olarak indir
          </button>
        </div>
        <div className="mt-5 divide-y text-sm">
          {consents.map((c) => (
            <div key={c.id} className="flex justify-between py-2">
              <span>
                {c.documentType === "TERMS"
                  ? "Kullanım koşulları"
                  : c.documentType === "PRIVACY"
                    ? "Gizlilik metni"
                    : c.documentType}
              </span>
              <span className="text-slate-500">
                v{c.documentVersion} ·{" "}
                {new Date(c.acceptedAt).toLocaleDateString("tr-TR")}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-danger-200 bg-danger-50 p-6">
        <h2 className="flex items-center gap-2 font-black text-danger-700">
          <Trash2 className="h-5 w-5" />
          Hesabı sil
        </h2>
        <p className="mt-2 text-sm text-danger-700">
          {user?.role === "CUSTOMER"
            ? "Aktif veya bekleyen aboneliğiniz varsa hesap silinemez. "
            : "Bağlı mağaza ve devam eden operasyonlarınızı işlemden önce kontrol edin. "}
          İşlem kişisel verilerinizi anonimleştirir ve tüm oturumları kapatır.
        </p>
        <div className="mt-4 grid max-w-sm gap-3">
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Mevcut şifreniz"
            autoComplete="current-password"
            className="h-11 w-full rounded-lg border border-danger-200 px-3 text-sm"
          />
          <input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="HESABIMI SIL"
            className="h-11 w-full rounded-lg border border-danger-200 px-3 text-sm"
          />
          <button
            disabled={
              !deletePassword ||
              deleteText !== "HESABIMI SIL" ||
              deleteAccount.isPending
            }
            onClick={() => deleteAccount.mutate()}
            className="w-fit rounded-lg bg-danger-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            {deleteAccount.isPending
              ? "Hesap kapatılıyor…"
              : "Hesabı kalıcı kapat"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm font-semibold text-danger-700">{error}</p>
        )}
      </section>
    </div>
  );
}
