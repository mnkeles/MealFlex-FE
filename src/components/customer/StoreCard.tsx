import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, MapPin, Star, Users } from "lucide-react";
import type { Store } from "@/types";
import FavoriteButton from "./FavoriteButton";
import { discoveryLabels } from "@/constants/discovery";
import MediaPlaceholder from "@/components/brand/MediaPlaceholder";

export default function StoreCard({
  store,
  addressId,
  compact = false,
}: {
  store: Store;
  addressId?: number;
  compact?: boolean;
}) {
  return (
    <Link
      to={`/stores/${store.id}${addressId ? `?addressId=${addressId}` : ""}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-floating"
    >
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-warning-100 to-danger-100 ${compact ? "h-28" : "h-44"}`}
      >
        <MediaPlaceholder
          src={store.coverImageUrl}
          alt=""
          kind="menu"
          imageClassName="transition duration-300 group-hover:scale-105"
        />
        <FavoriteButton storeId={store.id} className="absolute right-3 top-3" />
        {store.temporarilyClosed && (
          <span className="absolute inset-x-3 bottom-3 rounded-xl bg-slate-900/90 px-3 py-2 text-center text-xs font-bold text-white">
            Geçici olarak kapalı
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="-mt-5 grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-sm">
            <MediaPlaceholder
              src={store.logoUrl}
              alt=""
              kind="store"
              fallbackLabel={store.name}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-black text-ink">
                {store.name}
              </h3>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-600" />
            </div>
            {store.description && (
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                {store.description}
              </p>
            )}
            {!!store.categories?.length && (
              <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-primary-600">
                {store.categories
                  .map((value) => discoveryLabels[value] || value)
                  .join(" · ")}
              </p>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-success-50 px-2 py-1 text-xs font-bold text-success-700">
            <Star className="h-3.5 w-3.5 fill-success-600" />{" "}
            {store.rating || "Yeni"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          {store.distanceKm != null && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {store.distanceKm} km
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Min.{" "}
            {store.effectiveMinPersonCount ?? store.minPersonCount} kişi
          </span>
          <span className="ml-auto font-bold text-primary-600">
            {store.startingPrice
              ? `${store.startingPrice.toLocaleString("tr-TR")} ₺'den`
              : "Menüleri gör"}
          </span>
          {store.nextAvailableDeliveryDate && (
            <span className="flex w-full items-center gap-1.5 rounded-lg bg-success-50 px-2 py-1.5 font-bold text-success-700">
              <CalendarDays className="h-3.5 w-3.5" />
              İlk teslimat:{" "}
              {new Date(store.nextAvailableDeliveryDate).toLocaleDateString(
                "tr-TR",
              )}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
