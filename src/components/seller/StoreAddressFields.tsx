import {
  MapContainer,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import LocationSelects from "@/components/address/LocationSelects";
import LocationPin from "@/components/maps/LocationPin";
import { modernMapTiles } from "@/components/maps/mapStyle";

export interface StoreAddressValue {
  addressTitle: string;
  city: string;
  district: string;
  neighborhood: string;
  street: string;
  buildingNo: string;
  floor: string;
  apartmentNo: string;
  productionAddress: string;
  directions: string;
  latitude: string;
  longitude: string;
}

// eslint-disable-next-line react-refresh/only-export-components -- form defaults are shared by two seller pages.
export const emptyStoreAddress: StoreAddressValue = {
  addressTitle: "",
  city: "",
  district: "",
  neighborhood: "",
  street: "",
  buildingNo: "",
  floor: "",
  apartmentNo: "",
  productionAddress: "",
  directions: "",
  latitude: "39.9334",
  longitude: "32.8597",
};

function MapClick({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click: (event) => onChange(event.latlng.lat, event.latlng.lng),
  });
  return <LocationPin latitude={latitude} longitude={longitude} />;
}

export default function StoreAddressFields({
  value,
  onChange,
}: {
  value: StoreAddressValue;
  onChange: (value: StoreAddressValue) => void;
}) {
  const update = (field: keyof StoreAddressValue, fieldValue: string) =>
    onChange({ ...value, [field]: fieldValue });
  const latitude = Number(value.latitude) || 39.9334;
  const longitude = Number(value.longitude) || 32.8597;
  const locate = () =>
    navigator.geolocation?.getCurrentPosition((position) =>
      onChange({
        ...value,
        latitude: position.coords.latitude.toFixed(7),
        longitude: position.coords.longitude.toFixed(7),
      }),
    );

  return (
    <section className="mt-6 border-t border-slate-200 pt-6">
      <div>
        <h3 className="text-lg font-black text-slate-900">Mağaza adresi</h3>
        <p className="mt-1 text-sm text-slate-500">
          Teslimat mesafesi ve minimum kişi sınırı haritada seçtiğiniz konuma
          göre hesaplanır.
        </p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Adres başlığı
          <input
            required
            value={value.addressTitle}
            onChange={(event) => update("addressTitle", event.target.value)}
            placeholder="Merkez mutfak, Şube"
            className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
          />
        </label>
        <div />
        <LocationSelects
          value={value}
          onChange={(location) => onChange({ ...value, ...location })}
        />
        <label className="text-sm font-semibold">
          Cadde / Sokak
          <input
            value={value.street}
            onChange={(event) => update("street", event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
          />
        </label>
        <div className="grid grid-cols-3 gap-2 sm:col-span-2">
          <label className="text-sm font-semibold">
            Bina
            <input
              value={value.buildingNo}
              onChange={(event) => update("buildingNo", event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
            />
          </label>
          <label className="text-sm font-semibold">
            Kat
            <input
              value={value.floor}
              onChange={(event) => update("floor", event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
            />
          </label>
          <label className="text-sm font-semibold">
            Daire
            <input
              value={value.apartmentNo}
              onChange={(event) => update("apartmentNo", event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
            />
          </label>
        </div>
        <label className="text-sm font-semibold sm:col-span-2">
          Açık adres
          <textarea
            required
            value={value.productionAddress}
            onChange={(event) =>
              update("productionAddress", event.target.value)
            }
            rows={3}
            className="mt-2 w-full rounded-xl border p-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Adres tarifi
          <input
            value={value.directions}
            onChange={(event) => update("directions", event.target.value)}
            placeholder="Yakındaki bina veya ulaşım bilgisi"
            className="mt-2 h-11 w-full rounded-xl border px-3 font-normal"
          />
        </label>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-bold">Konumu haritada işaretleyin</p>
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
          center={[latitude, longitude]}
          zoom={13}
          className="h-64 w-full"
        >
          <TileLayer {...modernMapTiles} />
          <MapClick
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) =>
              onChange({
                ...value,
                latitude: lat.toFixed(7),
                longitude: lng.toFixed(7),
              })
            }
          />
        </MapContainer>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Enlem:{" "}
          <strong className="text-slate-700">{latitude.toFixed(7)}</strong>
        </p>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Boylam:{" "}
          <strong className="text-slate-700">{longitude.toFixed(7)}</strong>
        </p>
      </div>
    </section>
  );
}
