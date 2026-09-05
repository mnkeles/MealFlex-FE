import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { Check, LocateFixed, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { addressService } from "@/services/addressService";
import { useCustomerAddress } from "@/contexts/CustomerAddressContext";
import LocationSelects from "@/components/address/LocationSelects";
import type { Address } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/common/ConfirmModal";

interface AddressForm {
  title: string;
  city: string;
  district: string;
  neighborhood: string;
  street: string;
  buildingNo: string;
  floor: string;
  apartmentNo: string;
  fullAddress: string;
  directions: string;
  latitude: number;
  longitude: number;
}

const emptyForm: AddressForm = {
  title: "",
  city: "",
  district: "",
  neighborhood: "",
  street: "",
  buildingNo: "",
  floor: "",
  apartmentNo: "",
  fullAddress: "",
  directions: "",
  latitude: 39.9334,
  longitude: 32.8597,
};

function MapClick({
  value,
  onChange,
}: {
  value: { latitude: number; longitude: number };
  onChange: (value: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click: (event) =>
      onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
  });
  return (
    <CircleMarker
      center={[value.latitude, value.longitude]}
      radius={9}
      pathOptions={{ color: "#dc3626", fillColor: "#dc3626", fillOpacity: 1 }}
    />
  );
}

function addressPreview(
  address: Partial<
    Pick<
      AddressForm,
      | "street"
      | "buildingNo"
      | "floor"
      | "apartmentNo"
      | "neighborhood"
      | "district"
      | "city"
      | "fullAddress"
    >
  >,
) {
  const parts = [
    address.street &&
      `${address.street}${address.buildingNo ? `, No: ${address.buildingNo}` : ""}`,
    address.floor && `Kat: ${address.floor}`,
    address.apartmentNo && `Daire: ${address.apartmentNo}`,
    address.neighborhood,
    address.district,
    address.city,
  ].filter(Boolean);
  return (
    parts.join(", ") || address.fullAddress || "Adres bileşenlerini girin."
  );
}

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const { activeAddressId, setActiveAddressId } = useCustomerAddress();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number>();
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [mapConfirmed, setMapConfirmed] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<number>();
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressService.getMyAddresses,
  });
  const closeForm = () => {
    if (
      formDirty &&
      !window.confirm(
        "Kaydedilmemiş adres değişiklikleri var. Formu kapatmak istiyor musunuz?",
      )
    )
      return;
    setShowForm(false);
    setEditingId(undefined);
    setForm(emptyForm);
    setMapConfirmed(false);
    setFormDirty(false);
  };
  const save = useMutation({
    mutationFn: () =>
      editingId
        ? addressService.updateAddress(editingId, form)
        : addressService.createAddress(form),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      if (!activeAddressId) setActiveAddressId(address.id);
      closeForm();
    },
  });
  const remove = useMutation({
    mutationFn: addressService.deleteAddress,
    onSuccess: () => {
      setPendingRemoveId(undefined);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
  const makeDefault = useMutation({
    mutationFn: addressService.setDefaultAddress,
    onSuccess: (address) => {
      setActiveAddressId(address.id);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });
  const edit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      title: address.title,
      city: address.city,
      district: address.district,
      neighborhood: address.neighborhood || "",
      street: address.street || "",
      buildingNo: address.buildingNo || "",
      floor: address.floor || "",
      apartmentNo: address.apartmentNo || "",
      fullAddress: address.fullAddress || "",
      directions: address.directions || "",
      latitude: address.latitude,
      longitude: address.longitude,
    });
    setMapConfirmed(true);
    setFormDirty(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const locate = () =>
    navigator.geolocation?.getCurrentPosition((position) => {
      setForm((value) => ({
        ...value,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }));
      setMapConfirmed(true);
    });
  useEffect(() => {
    if (!showForm || !formDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [showForm, formDirty]);

  return (
    <div className="mf-page">
      <PageHeader
        eyebrow="Teslimat"
        title="Adreslerim"
        description="İşletmeler seçtiğiniz teslimat konumuna göre listelenir."
        actions={
          <Button
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            leftIcon={!showForm ? <Plus className="h-4 w-4" /> : undefined}
          >
            {showForm ? "Vazgeç" : "Yeni adres"}
          </Button>
        }
      />
      <div className="hidden">
        <div>
          <p className="text-sm font-bold text-primary-600">TESLİMAT</p>
          <h1 className="mt-1 text-3xl font-black">Adreslerim</h1>
          <p className="mt-2 text-slate-500">
            İşletmeler seçtiğiniz teslimat konumuna göre listelenir.
          </p>
        </div>
        <button
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white"
        >
          {showForm ? (
            "Vazgeç"
          ) : (
            <>
              <Plus className="h-4 w-4" /> Yeni adres
            </>
          )}
        </button>
      </div>

      {showForm && (
        <form
          onChange={() => setFormDirty(true)}
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
          className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <h2 className="text-xl font-black">
            {editingId ? "Adresi düzenle" : "Yeni adres ekle"}
          </h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)] lg:items-start">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Adres başlığı
                  <input
                    required
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    placeholder="Ofis, Ev"
                    className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
                  />
                </label>
                <div />
                <LocationSelects
                  value={form}
                  onChange={(location) =>
                    setForm((current) => ({ ...current, ...location }))
                  }
                />
                <label className="text-sm font-semibold">
                  Cadde / Sokak
                  <input
                    value={form.street}
                    onChange={(event) =>
                      setForm({ ...form, street: event.target.value })
                    }
                    className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
                  />
                </label>
                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                  <label className="text-sm font-semibold">
                    Bina
                    <input
                      value={form.buildingNo}
                      onChange={(event) =>
                        setForm({ ...form, buildingNo: event.target.value })
                      }
                      className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Kat
                    <input
                      value={form.floor}
                      onChange={(event) =>
                        setForm({ ...form, floor: event.target.value })
                      }
                      className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Daire
                    <input
                      value={form.apartmentNo}
                      onChange={(event) =>
                        setForm({ ...form, apartmentNo: event.target.value })
                      }
                      className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
                    />
                  </label>
                </div>
                <label className="text-sm font-semibold sm:col-span-2">
                  Açık adres
                  <textarea
                    value={form.fullAddress}
                    onChange={(event) =>
                      setForm({ ...form, fullAddress: event.target.value })
                    }
                    rows={3}
                    className="mt-2 w-full rounded-xl border p-3 font-normal"
                  />
                </label>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <span className="font-bold">Adres önizlemesi:</span>{" "}
                {addressPreview(form)}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border lg:sticky lg:top-24">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">
                    Konumu haritada işaretleyin
                  </p>
                  <p className="text-xs text-slate-500">
                    Mesafe hesabı bu noktaya göre yapılır.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={locate}
                  className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-primary-600 shadow-sm"
                >
                  <LocateFixed className="h-4 w-4" /> Konumumu kullan
                </button>
              </div>
              <MapContainer
                key={`${form.latitude}-${form.longitude}-${editingId || "new"}`}
                center={[form.latitude, form.longitude]}
                zoom={13}
                className="h-72 w-full lg:h-[31rem]"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClick
                  value={form}
                  onChange={(point) => {
                    setForm((value) => ({ ...value, ...point }));
                    setMapConfirmed(true);
                  }}
                />
              </MapContainer>
            </div>
          </div>
          {!mapConfirmed && (
            <p className="mt-3 text-xs font-semibold text-warning-700">
              Adresinizin harita konumunu doğrulamak için haritaya dokunun veya
              “Konumumu kullan” seçeneğini kullanın.
            </p>
          )}
          <div className="mt-5 flex justify-end">
            <button
              disabled={save.isPending || !mapConfirmed}
              className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {save.isPending ? "Kaydediliyor..." : "Adresi kaydet"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="mt-7 h-40 animate-pulse rounded-2xl bg-slate-200" />
      ) : !addresses.length ? (
        <div className="mt-7 rounded-2xl bg-white p-12 text-center text-slate-500">
          Henüz adres eklenmemiş.
        </div>
      ) : (
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <article
              key={address.id}
              className={`relative rounded-2xl border bg-white p-5 shadow-sm ${activeAddressId === address.id ? "border-primary-400 ring-2 ring-primary-100" : "border-slate-200"}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${activeAddressId === address.id ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-black">{address.title}</h2>
                    {activeAddressId === address.id && (
                      <span className="flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-[10px] font-bold text-primary-700">
                        <Check className="h-3 w-3" /> Aktif
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {addressPreview(address)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Harita: {address.latitude.toFixed(5)},{" "}
                    {address.longitude.toFixed(5)}
                  </p>
                </div>
              </div>
              {address.nearbyAddressWarning && (
                <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-xs font-semibold text-warning-800">
                  Bu konuma çok yakın başka bir kayıtlı adresiniz var. Teslimat
                  için doğru adresi seçtiğinizden emin olun.
                </p>
              )}
              <div className="mt-5 flex items-center gap-2 border-t pt-4">
                {activeAddressId !== address.id && (
                  <button
                    onClick={() => setActiveAddressId(address.id)}
                    className="mr-auto text-xs font-bold text-primary-600"
                  >
                    Teslimat adresi yap
                  </button>
                )}
                {!address.defaultAddress && (
                  <button
                    onClick={() => makeDefault.mutate(address.id)}
                    disabled={makeDefault.isPending}
                    className="text-xs font-bold text-slate-600 disabled:opacity-50"
                  >
                    Varsayılan yap
                  </button>
                )}
                {address.defaultAddress && (
                  <span className="text-xs font-bold text-success-600">
                    Varsayılan
                  </span>
                )}
                <button
                  onClick={() => edit(address)}
                  aria-label={`${address.title} adresini düzenle`}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPendingRemoveId(address.id)}
                  aria-label={`${address.title} adresini sil`}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-danger-50 text-danger-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <ConfirmModal
        open={!!pendingRemoveId}
        title="Adresi sil"
        message="Bu adres teslimat seçiminden kaldırılacak. Devam etmek istiyor musunuz?"
        confirmLabel="Adresi sil"
        danger
        pending={remove.isPending}
        onClose={() => setPendingRemoveId(undefined)}
        onConfirm={() => pendingRemoveId && remove.mutate(pendingRemoveId)}
      />
    </div>
  );
}
