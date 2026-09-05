import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const dayLabels: Record<string, string> = {
  MONDAY: "Pazartesi",
  TUESDAY: "Salı",
  WEDNESDAY: "Çarşamba",
  THURSDAY: "Perşembe",
  FRIDAY: "Cuma",
  SATURDAY: "Cumartesi",
  SUNDAY: "Pazar",
};

export default function SellerStorePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    productionAddress: "",
    latitude: "39.9334",
    longitude: "32.8597",
  });
  const [areaForm, setAreaForm] = useState({ city: "Ankara", district: "" });
  const [hours, setHours] = useState(
    days.map((d) => ({
      dayOfWeek: d,
      open: d !== "SUNDAY",
      openTime: "11:00",
      closeTime: "15:00",
    })),
  );

  const { data: store, isLoading } = useQuery({
    queryKey: ["seller-store"],
    queryFn: sellerService.getMyStore,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: sellerService.createStore,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["seller-store"] }),
  });

  const updateMutation = useMutation({
    mutationFn: sellerService.updateStore,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["seller-store"] }),
  });

  const hoursMutation = useMutation({
    mutationFn: sellerService.setBusinessHours,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["seller-store"] }),
  });

  const areaMutation = useMutation({
    mutationFn: sellerService.addServiceArea,
    onSuccess: () => setAreaForm({ ...areaForm, district: "" }),
  });

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      description: form.description || undefined,
      productionAddress: form.productionAddress || undefined,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };
    if (store) updateMutation.mutate(data);
    else
      createMutation.mutate({
        ...data,
        maxDeliveryDistanceKm: 30,
        distanceRules: [
          { distanceKm: 10, minPersonCount: 20 },
          { distanceKm: 15, minPersonCount: 25 },
          { distanceKm: 20, minPersonCount: 30 },
          { distanceKm: 30, minPersonCount: 35 },
        ],
      });
  };

  if (isLoading)
    return (
      <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-6">Mağaza Ayarları</h1>
        <form
          onSubmit={handleStoreSubmit}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adres
              </label>
              <input
                type="text"
                value={form.productionAddress}
                onChange={(e) =>
                  setForm({ ...form, productionAddress: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
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
                rows={3}
              />
            </div>
            <input
              type="number"
              step="0.0000001"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Enlem"
              required
            />
            <input
              type="number"
              step="0.0000001"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Boylam"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            {store ? "Güncelle" : "Mağaza Oluştur"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Çalışma Saatleri</h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-3">
            {hours.map((h, i) => (
              <div key={h.dayOfWeek} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium">
                  {dayLabels[h.dayOfWeek]}
                </span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={h.open}
                    onChange={(e) => {
                      const newHours = [...hours];
                      newHours[i] = { ...h, open: e.target.checked };
                      setHours(newHours);
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">Açık</span>
                </label>
                {h.open ? (
                  <>
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => {
                        const newHours = [...hours];
                        newHours[i] = { ...h, openTime: e.target.value };
                        setHours(newHours);
                      }}
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => {
                        const newHours = [...hours];
                        newHours[i] = { ...h, closeTime: e.target.value };
                        setHours(newHours);
                      }}
                      className="px-2 py-1 border rounded text-sm"
                    />
                  </>
                ) : (
                  <span className="text-sm text-danger-500 font-medium">
                    Kapalı
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => hoursMutation.mutate(hours)}
            disabled={hoursMutation.isPending}
            className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            Saatleri Kaydet
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Hizmet Bölgeleri</h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={areaForm.city}
              onChange={(e) =>
                setAreaForm({ ...areaForm, city: e.target.value })
              }
              placeholder="İl"
              className="px-3 py-2 border rounded-lg text-sm w-40"
            />
            <input
              type="text"
              value={areaForm.district}
              onChange={(e) =>
                setAreaForm({ ...areaForm, district: e.target.value })
              }
              placeholder="İlçe"
              className="px-3 py-2 border rounded-lg text-sm w-40"
            />
            <button
              onClick={() => areaForm.district && areaMutation.mutate(areaForm)}
              disabled={!areaForm.district || areaMutation.isPending}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
