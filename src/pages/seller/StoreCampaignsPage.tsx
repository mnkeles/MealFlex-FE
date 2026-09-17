import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";

const today = new Date().toISOString().slice(0, 10);
const steps = ["Temel bilgi", "İndirim ve koşullar", "Yayın takvimi"];

export default function StoreCampaignsPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    code: "",
    campaignType: "PERCENT",
    discountValue: 10,
    minAmount: "",
    maxUsesPerCustomer: 1,
    firstSubscriptionOnly: false,
    startDate: today,
    endDate: today,
  });
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", storeId],
    queryFn: () => sellerService.getCampaigns(storeId),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["campaigns", storeId] });
  const create = useMutation({
    mutationFn: () =>
      sellerService.createCampaign(storeId, {
        ...form,
        discountValue: Number(form.discountValue),
        minAmount: form.minAmount ? Number(form.minAmount) : undefined,
      }),
    onSuccess: () => {
      setForm((current) => ({ ...current, name: "", code: "" }));
      setStep(0);
      refresh();
    },
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      sellerService.setCampaignActive(storeId, id, active),
    onSuccess: refresh,
  });
  const canContinue = step !== 0 || Boolean(form.name.trim());

  return (
    <div className="space-y-6">
      <div className="border-b border-[#e7e7e7] pb-5">
        <p className="customer-eyebrow">Büyüme araçları</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">Kampanyalar ve kuponlar</h2>
        <p className="mt-1 text-sm text-slate-500">
          Koşulları sırayla tanımlayın; son adımda yayına alma tarihini kontrol
          edin.
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
        className="mf-surface p-5"
      >
        <ol className="mb-6 grid gap-2 sm:grid-cols-3">
          {steps.map((label, index) => (
            <li
              key={label}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${index === step ? "bg-primary-600 text-white" : index < step ? "bg-success-50 text-success-700" : "bg-slate-100 text-slate-500"}`}
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
        {step === 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              Kampanya adı
              <input
                required
                autoFocus
                placeholder="Örn. İlk aboneliğe hoş geldin"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className="mf-input mt-1"
              />
            </label>
            <label className="text-sm font-medium">
              Kupon kodu{" "}
              <span className="font-normal text-slate-500">(isteğe bağlı)</span>
              <input
                placeholder="HOSGELDIN"
                value={form.code}
                onChange={(event) =>
                  setForm({ ...form, code: event.target.value.toUpperCase() })
                }
                className="mf-input mt-1"
              />
            </label>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              İndirim türü
              <select
                value={form.campaignType}
                onChange={(event) =>
                  setForm({ ...form, campaignType: event.target.value })
                }
                className="mf-input mt-1"
              >
                <option value="PERCENT">Yüzde indirim</option>
                <option value="FIXED">Sabit indirim</option>
                <option value="FREE_DAYS">Ücretsiz gün</option>
                <option value="CORPORATE">Kurumsal fiyat</option>
                <option value="REFERRAL">Referans ödülü</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              İndirim değeri
              <input
                type="number"
                min="0"
                value={form.discountValue}
                onChange={(event) =>
                  setForm({
                    ...form,
                    discountValue: Number(event.target.value),
                  })
                }
                className="mf-input mt-1"
              />
            </label>
            <label className="text-sm font-medium">
              Minimum tutar{" "}
              <span className="font-normal text-slate-500">(TL)</span>
              <input
                type="number"
                min="0"
                value={form.minAmount}
                onChange={(event) =>
                  setForm({ ...form, minAmount: event.target.value })
                }
                className="mf-input mt-1"
              />
            </label>
            <label className="text-sm font-medium">
              Müşteri başına kullanım
              <input
                type="number"
                min="1"
                value={form.maxUsesPerCustomer}
                onChange={(event) =>
                  setForm({
                    ...form,
                    maxUsesPerCustomer: Number(event.target.value),
                  })
                }
                className="mf-input mt-1"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
              <input
                type="checkbox"
                checked={form.firstSubscriptionOnly}
                onChange={(event) =>
                  setForm({
                    ...form,
                    firstSubscriptionOnly: event.target.checked,
                  })
                }
              />{" "}
              Yalnız ilk abonelikte kullanılabilir
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              Başlangıç
              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm({ ...form, startDate: event.target.value })
                }
                className="mf-input mt-1"
              />
            </label>
            <label className="text-sm font-medium">
              Bitiş
              <input
                type="date"
                min={form.startDate}
                value={form.endDate}
                onChange={(event) =>
                  setForm({ ...form, endDate: event.target.value })
                }
                className="mf-input mt-1"
              />
            </label>
            <aside className="rounded-lg bg-primary-50 p-4 text-sm text-primary-900 md:col-span-2">
              <strong>Önizleme:</strong> {form.name || "Adsız kampanya"} ·{" "}
              {form.code || "Kodsuz"} · {form.startDate} – {form.endDate}
            </aside>
          </div>
        )}
        <div className="mt-6 flex justify-between gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((value) => value - 1)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 disabled:opacity-40"
          >
            Geri
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((value) => value + 1)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Devam et
            </button>
          ) : (
            <button
              disabled={create.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Kampanyayı oluştur
            </button>
          )}
        </div>
        {create.isError && (
          <p className="mt-3 text-sm text-danger-700">
            Kampanya oluşturulamadı. Tarih ve indirim alanlarını kontrol edin.
          </p>
        )}
      </form>
      <div className="mt-6 overflow-hidden mf-surface">
        {isLoading ? (
          <p className="p-4">Yükleniyor...</p>
        ) : campaigns.length === 0 ? (
          <p className="p-4 text-slate-500">Henüz kampanya yok.</p>
        ) : (
          campaigns.map((campaign) => (
            <div
              className="flex flex-wrap justify-between gap-4 border-b p-4"
              key={campaign.id}
            >
              <div>
                <strong>{campaign.name}</strong>
                <p className="mt-1 text-sm text-slate-500">
                  {campaign.code || "Kodsuz"} · {campaign.campaignType} ·{" "}
                  {campaign.discountValue} · {campaign.startDate} –{" "}
                  {campaign.endDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  toggle.mutate({ id: campaign.id, active: !campaign.active })
                }
                className="text-sm font-bold text-primary-700"
              >
                {campaign.active ? "Pasife al" : "Aktifleştir"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
