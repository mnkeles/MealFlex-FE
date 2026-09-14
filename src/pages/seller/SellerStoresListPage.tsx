import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import { Link } from "react-router-dom";
import StoreAddressFields, {
  emptyStoreAddress,
} from "@/components/seller/StoreAddressFields";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import QueryBoundary from "@/components/ui/QueryBoundary";
import Button from "@/components/ui/Button";
import { parseApiError } from "@/utils/apiErrors";
import { MapPin, Star, Store as StoreIcon } from "lucide-react";

const DEFAULT_MAX_KM = "30";
const DEFAULT_DISTANCE_RULES = [
  { fromKm: "0", toKm: "10", minPersonCount: "20" },
  { fromKm: "10", toKm: "15", minPersonCount: "25" },
  { fromKm: "15", toKm: "20", minPersonCount: "30" },
  { fromKm: "20", toKm: "30", minPersonCount: "35" },
];

export default function SellerStoresListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    ...emptyStoreAddress,
  });
  const [maxKm, setMaxKm] = useState(DEFAULT_MAX_KM);
  const [distanceRules, setDistanceRules] = useState(() =>
    DEFAULT_DISTANCE_RULES.map((rule) => ({ ...rule })),
  );
  const [formError, setFormError] = useState("");

  const storesQuery = useQuery({
    queryKey: ["seller-stores", user?.userId],
    queryFn: sellerService.getMyStores,
  });
  const stores = storesQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: sellerService.createStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-stores"] });
      setShowForm(false);
      setForm({ name: "", description: "", ...emptyStoreAddress });
      setMaxKm(DEFAULT_MAX_KM);
      setDistanceRules(DEFAULT_DISTANCE_RULES.map((rule) => ({ ...rule })));
      setFormError("");
    },
    onError: (error) =>
      setFormError(parseApiError(error, "Mağaza oluşturulamadı.").message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const maximum = Number(maxKm);
    const parsedRules = distanceRules.map((rule) => ({
      fromKm: Number(rule.fromKm),
      toKm: Number(rule.toKm),
      minPersonCount: Number(rule.minPersonCount),
    }));

    if (!Number.isInteger(maximum) || maximum < 1 || maximum > 30) {
      setFormError("Maksimum teslimat mesafesi 1-30 km arasında olmalıdır.");
      return;
    }
    if (
      parsedRules.some(
        (rule) =>
          !Number.isInteger(rule.toKm) ||
          rule.toKm <= rule.fromKm ||
          !Number.isInteger(rule.minPersonCount) ||
          rule.minPersonCount < 1,
      )
    ) {
      setFormError(
        "Her mesafe aralığının bitiş km ve minimum kişi değerlerini doğru girin.",
      );
      return;
    }
    if (
      parsedRules[0]?.fromKm !== 0 ||
      parsedRules.some(
        (rule, index) =>
          index > 0 && rule.fromKm !== parsedRules[index - 1].toKm,
      )
    ) {
      setFormError(
        "Mesafe aralıkları 0 km’den başlamalı, boşluk veya çakışma içermemelidir.",
      );
      return;
    }
    if (parsedRules[parsedRules.length - 1]?.toKm !== maximum) {
      setFormError("Son kuralın bitiş km’si maksimum km ile aynı olmalıdır.");
      return;
    }

    setFormError("");
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      productionAddress: form.productionAddress || undefined,
      addressTitle: form.addressTitle || undefined,
      city: form.city || undefined,
      district: form.district || undefined,
      neighborhood: form.neighborhood || undefined,
      street: form.street || undefined,
      buildingNo: form.buildingNo || undefined,
      floor: form.floor || undefined,
      apartmentNo: form.apartmentNo || undefined,
      directions: form.directions || undefined,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      maxDeliveryDistanceKm: maximum,
      distanceRules: parsedRules.map((rule) => ({
        distanceKm: rule.toKm,
        minPersonCount: rule.minPersonCount,
      })),
    });
  };

  const addRule = () => {
    const last = distanceRules[distanceRules.length - 1];
    setDistanceRules([
      ...distanceRules,
      { fromKm: last?.toKm || "", toKm: "", minPersonCount: "" },
    ]);
  };
  const removeRule = (i: number) => {
    const nextRules = distanceRules.filter((_, idx) => idx !== i);
    setDistanceRules(
      nextRules.map((rule, index) => ({
        ...rule,
        fromKm: index === 0 ? "0" : nextRules[index - 1].toKm,
      })),
    );
  };
  const updateRule = (i: number, field: string, value: string) => {
    const r = [...distanceRules];
    r[i] = { ...r[i], [field]: value };
    if (field === "toKm" && i < r.length - 1)
      r[i + 1] = { ...r[i + 1], fromKm: value };
    setDistanceRules(r);
  };
  const lastToKm = distanceRules[distanceRules.length - 1]?.toKm;
  const maxKmMismatch = lastToKm !== maxKm && maxKm !== "" && lastToKm !== "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Mağazalarım</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          {showForm ? "İptal" : "+ Yeni Mağaza"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
          <h2 className="text-lg font-semibold mb-4">Yeni Mağaza Oluştur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mağaza Adı *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={2}
              />
            </div>
          </div>

          <StoreAddressFields
            value={form}
            onChange={(address) =>
              setForm((current) => ({ ...current, ...address }))
            }
          />

          <div className="mb-4 mt-6 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">
                Mesafe Kuralları
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Maks. Km:</label>
                <input
                  type="number"
                  value={maxKm}
                  onChange={(e) => setMaxKm(e.target.value)}
                  className="w-20 px-2 py-1 border rounded-lg text-sm"
                  min="1"
                  max="30"
                  required
                />
                <button
                  type="button"
                  onClick={addRule}
                  className="text-xs text-primary-600 hover:underline"
                >
                  + Kural Ekle
                </button>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-4 gap-2 text-xs font-medium text-slate-500 px-1 mb-1">
                <span>Başlangıç (km)</span>
                <span>Bitiş (km)</span>
                <span>Min Kişi</span>
                <span></span>
              </div>
              {distanceRules.map((rule, i) => {
                const isLast = i === distanceRules.length - 1;
                const toKmError =
                  isLast && maxKm && rule.toKm && rule.toKm !== maxKm;
                return (
                  <div key={i} className="grid grid-cols-4 gap-2 items-center">
                    <input
                      type="number"
                      value={rule.fromKm}
                      className="px-2 py-1.5 border rounded-lg text-sm bg-slate-100"
                      readOnly
                      placeholder="0"
                    />
                    <div>
                      <input
                        type="number"
                        value={rule.toKm}
                        onChange={(e) => updateRule(i, "toKm", e.target.value)}
                        className={`w-full px-2 py-1.5 border rounded-lg text-sm ${toKmError ? "border-danger-400" : ""}`}
                        min={Number(rule.fromKm) + 1}
                        max="30"
                        required
                        placeholder="km"
                      />
                      {toKmError && (
                        <p className="text-xs text-danger-500 mt-0.5">
                          Maks. km ile eşleşmeli
                        </p>
                      )}
                    </div>
                    <input
                      type="number"
                      value={rule.minPersonCount}
                      onChange={(e) =>
                        updateRule(i, "minPersonCount", e.target.value)
                      }
                      className="px-2 py-1.5 border rounded-lg text-sm"
                      min="1"
                      required
                      placeholder="kişi"
                    />
                    <div className="flex justify-end">
                      {distanceRules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRule(i)}
                          className="text-danger-500 text-sm px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {maxKmMismatch && (
                <p className="text-xs text-warning-600 mt-1">
                  ⚠️ Son kuralın bitiş km’si ({lastToKm}) maks. km ({maxKm}) ile
                  eşleşmiyor.
                </p>
              )}
            </div>
          </div>

          {formError && (
            <p className="mb-3 text-sm text-danger-600">{formError}</p>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending || maxKmMismatch}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Oluşturuluyor..." : "Mağaza Oluştur"}
          </button>
        </form>
      )}

      <QueryBoundary
        query={storesQuery}
        loadingLabel="Mağazalarınız yükleniyor..."
        errorTitle="Mağazalarınız yüklenemedi"
        errorDescription="Bağlantıyı kontrol edip tekrar deneyin."
        isEmpty={(data) => data.length === 0 && !showForm}
        emptyTitle="Henüz mağazanız bulunmuyor"
        emptyDescription="İlk mağazanızı oluşturarak satıcı vitrininizi hazırlayın."
        emptyAction={
          <Button onClick={() => setShowForm(true)}>İlk mağazanızı oluşturun</Button>
        }
      >
        {() => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <article
                key={store.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-floating"
              >
                <div className="relative h-28 bg-gradient-to-br from-warning-100 via-cream to-success-100">
                  {store.coverImageUrl && (
                    <img src={store.coverImageUrl} alt="" className="h-full w-full object-contain" />
                  )}
                  <div className="absolute -bottom-8 left-5 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={`${store.name} logosu`} className="h-full w-full object-contain" />
                    ) : (
                      <StoreIcon className="h-7 w-7 text-primary-500" aria-hidden="true" />
                    )}
                  </div>
                </div>
                <div className="p-5 pt-11">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 truncate font-black text-slate-900">{store.name}</h3>
                    <StatusBadge domain="store" status={store.status} />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
                    {store.district && store.city
                      ? `${store.district}, ${store.city}`
                      : "Konum bilgisi eklenmemiş"}
                  </p>
                  {store.description && (
                    <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500 line-clamp-2">
                      {store.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <Star className="h-3.5 w-3.5 text-warning-500" aria-hidden="true" />
                    {store.reviewCount > 0
                      ? `${store.rating.toLocaleString("tr-TR")} · ${store.reviewCount} değerlendirme`
                      : "Henüz değerlendirme yok"}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      to={`/seller/stores/${store.id}/dashboard`}
                      className="rounded-lg bg-primary-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-700"
                    >
                      Mağazayı yönet
                    </Link>
                    <Link
                      to={`/seller/stores/${store.id}/showcase`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
                    >
                      Vitrini düzenle
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
