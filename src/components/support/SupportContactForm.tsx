import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { LifeBuoy, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  supportService,
  type SupportRequestInput,
} from "@/services/supportService";
import { parseApiError } from "@/utils/apiErrors";

const categoryOptions = [
  ["ACCOUNT", "Hesap"],
  ["PAYMENT", "Ödeme"],
  ["SUBSCRIPTION", "Abonelik"],
  ["DELIVERY", "Teslimat"],
  ["STORE", "Mağaza"],
  ["TECHNICAL", "Teknik sorun"],
  ["OTHER", "Diğer"],
] as const;

export default function SupportContactForm() {
  const { user } = useAuth();
  const [form, setForm] = useState<SupportRequestInput>({
    contactName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    contactEmail: user?.email || "",
    contactPhone: "",
    category: user?.role === "SELLER" ? "STORE" : "SUBSCRIPTION",
    subject: "",
    message: "",
  });
  const request = useMutation({
    mutationFn: supportService.create,
    onSuccess: () =>
      setForm((current) => ({ ...current, subject: "", message: "" })),
  });
  const update = <K extends keyof SupportRequestInput>(
    key: K,
    value: SupportRequestInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    request.mutate(form);
  };

  return (
    <section className="rounded-2xl bg-slate-950 p-5 text-white shadow-card sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-primary-300">
          <LifeBuoy className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black">Bize ulaşın</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            İletişim bilgilerinizi ve yaşadığınız sorunu yazın. Talebiniz MealFlex
            destek ekibinin yönetim ekranına iletilir.
          </p>
        </div>
      </div>

      {request.isSuccess ? (
        <div role="status" className="mt-5 rounded-2xl bg-success-50 p-5 text-success-900">
          <strong>Destek talebiniz alındı.</strong>
          <p className="mt-1 text-sm">
            Talep numaranız #{request.data.id}. Ekibimiz talebinizi yanıtladığında
            uygulama içinden bildirim alacaksınız.
          </p>
          <button
            type="button"
            onClick={() => request.reset()}
            className="mt-3 text-sm font-black underline"
          >
            Yeni talep oluştur
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Ad soyad
            <input
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={form.contactName}
              onChange={(event) => update("contactName", event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-white px-3 font-normal text-slate-900 outline-none focus:ring-4 focus:ring-primary-300/30"
            />
          </label>
          <label className="text-sm font-bold">
            E-posta
            <input
              required
              type="email"
              maxLength={255}
              autoComplete="email"
              value={form.contactEmail}
              onChange={(event) => update("contactEmail", event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-white px-3 font-normal text-slate-900 outline-none focus:ring-4 focus:ring-primary-300/30"
            />
          </label>
          <label className="text-sm font-bold">
            Telefon <span className="font-normal text-slate-400">(isteğe bağlı)</span>
            <input
              type="tel"
              maxLength={25}
              autoComplete="tel"
              value={form.contactPhone}
              onChange={(event) => update("contactPhone", event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-white px-3 font-normal text-slate-900 outline-none focus:ring-4 focus:ring-primary-300/30"
            />
          </label>
          <label className="text-sm font-bold">
            Kategori
            <select
              aria-label="Kategori"
              value={form.category}
              onChange={(event) =>
                update("category", event.target.value as SupportRequestInput["category"])
              }
              className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-white px-3 font-normal text-slate-900 outline-none focus:ring-4 focus:ring-primary-300/30"
            >
              {categoryOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            Konu
            <input
              required
              minLength={5}
              maxLength={150}
              value={form.subject}
              onChange={(event) => update("subject", event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-white/15 bg-white px-3 font-normal text-slate-900 outline-none focus:ring-4 focus:ring-primary-300/30"
            />
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            Mesajınız
            <textarea
              required
              minLength={20}
              maxLength={3000}
              rows={5}
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-white p-3 font-normal text-slate-900 outline-none focus:ring-4 focus:ring-primary-300/30"
            />
            <span className="mt-1 block text-right text-xs font-normal text-slate-400">
              {form.message.length}/3000
            </span>
          </label>
          {request.isError && (
            <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm font-semibold text-danger-700 sm:col-span-2">
              {parseApiError(request.error, "Talebiniz gönderilemedi. Lütfen tekrar deneyin.").message}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={request.isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {request.isPending ? "Gönderiliyor…" : "Destek talebi gönder"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
