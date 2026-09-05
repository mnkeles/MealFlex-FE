import { useState } from "react";
import { CreditCard } from "lucide-react";
import { paymentService, type PaymentMethod } from "@/services/paymentService";

export default function MockCardTokenizationForm({
  onAdded,
}: {
  onAdded: (method: PaymentMethod) => void;
}) {
  const [form, setForm] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvv: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const updateCardNumber = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 16);
    setForm({ ...form, number: digits.replace(/(.{4})/g, "$1 ").trim() });
  };

  const updateExpiry = (rawValue: string) => {
    if (
      form.expiry.endsWith("/") &&
      rawValue === form.expiry.slice(0, -1)
    ) {
      setForm({ ...form, expiry: rawValue });
      return;
    }
    const digits = rawValue.replace(/\D/g, "").slice(0, 4);
    const expiry =
      digits.length >= 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits;
    setForm({ ...form, expiry });
  };

  const updateCvv = (rawValue: string) => {
    setForm({ ...form, cvv: rawValue.replace(/\D/g, "").slice(0, 3) });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const digits = form.number.replace(/\D/g, "");
    const [month, year] = form.expiry.split("/").map(Number);
    const now = new Date();
    const fullYear = 2000 + year;
    if (!form.holder.trim()) return setError("Kart üzerindeki adı girin.");
    if (digits.length !== 16)
      return setError("Kart numarası 16 rakam olmalıdır.");
    if (!/^\d{2}\/\d{2}$/.test(form.expiry) || month < 1 || month > 12)
      return setError("Son kullanma tarihini AA/YY biçiminde girin.");
    if (
      fullYear < now.getFullYear() ||
      (fullYear === now.getFullYear() && month < now.getMonth() + 1)
    )
      return setError("Kartın son kullanma tarihi geçmiş olamaz.");
    if (!/^\d{3}$/.test(form.cvv))
      return setError("CVV güvenlik kodu 3 rakam olmalıdır.");
    setBusy(true);
    try {
      // Geliştirme sağlayıcısında hassas alanlar yalnız bu bileşende kalır; API'ye token ve maskeli meta veri gider.
      const token = `tok_${crypto.randomUUID()}`;
      const method = await paymentService.addMethod({
        providerToken: token,
        cardHolderName: form.holder,
        brand: digits.startsWith("4") ? "Visa" : "Mastercard",
        lastFour: digits.slice(-4),
        expiryMonth: month,
        expiryYear: fullYear,
        makeDefault: true,
      });
      setForm({ holder: "", number: "", expiry: "", cvv: "" });
      onAdded(method);
    } catch {
      setError("Kart tokenlaştırılamadı. Tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <CreditCard className="h-4 w-4 text-primary-600" aria-hidden="true" />{" "}
        Yeni kart ekle{" "}
        <span className="rounded bg-warning-100 px-2 py-0.5 text-[10px] text-warning-700">
          Geliştirme sağlayıcısı
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sr-only" htmlFor="card-holder">
          Kart üzerindeki ad
        </label>
        <input
          id="card-holder"
          required
          placeholder="Kart üzerindeki ad"
          value={form.holder}
          onChange={(e) => setForm({ ...form, holder: e.target.value })}
          className="h-11 rounded-xl border px-3 text-sm sm:col-span-2"
        />
        <label className="sr-only" htmlFor="card-number">
          Kart numarası
        </label>
        <input
          id="card-number"
          required
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="Kart numarası"
          maxLength={19}
          value={form.number}
          onChange={(e) => updateCardNumber(e.target.value)}
          className="h-11 rounded-xl border px-3 text-sm sm:col-span-2"
        />
        <label className="sr-only" htmlFor="card-expiry">
          Son kullanma tarihi
        </label>
        <input
          id="card-expiry"
          required
          inputMode="numeric"
          placeholder="AA/YY"
          autoComplete="cc-exp"
          maxLength={5}
          pattern="[0-9]{2}/[0-9]{2}"
          value={form.expiry}
          onChange={(e) => updateExpiry(e.target.value)}
          className="h-11 rounded-xl border px-3 text-sm"
        />
        <label className="sr-only" htmlFor="card-cvv">
          CVV güvenlik kodu
        </label>
        <input
          id="card-cvv"
          required
          type="password"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="CVV"
          maxLength={3}
          pattern="[0-9]{3}"
          value={form.cvv}
          onChange={(e) => updateCvv(e.target.value)}
          className="h-11 rounded-xl border px-3 text-sm"
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger-600">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? "Ekleniyor..." : "Kartı güvenli ekle"}
      </button>
    </form>
  );
}
