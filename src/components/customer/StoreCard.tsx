import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Star, Users } from "lucide-react";
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
      className="group block min-w-0"
    >
      <div className={`relative overflow-hidden rounded-2xl bg-[#eeeeee] ${compact ? "h-36" : "h-48"}`}>
        <MediaPlaceholder
          src={store.coverImageUrl}
          alt=""
          kind="menu"
          fit="cover"
          imageClassName="transition duration-500 group-hover:scale-[1.035]"
        />
        <FavoriteButton storeId={store.id} className="absolute right-3 top-3" />
        <span className="absolute bottom-3 left-3 grid h-11 w-11 place-items-center overflow-hidden rounded-xl border border-white/80 bg-white shadow-mf-sm">
          <MediaPlaceholder
            src={store.logoUrl}
            alt=""
            kind="store"
            fallbackLabel={store.name}
            fit="contain"
          />
        </span>
        {store.temporarilyClosed && (
          <span className="absolute bottom-3 right-3 rounded-lg bg-[#191919]/90 px-3 py-1.5 text-xs font-bold text-white">
            Geçici olarak kapalı
          </span>
        )}
      </div>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold tracking-tight text-ink transition group-hover:text-primary-700">
              {store.name}
            </h3>
            {!!store.categories?.length && (
              <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                {store.categories
                  .slice(0, 3)
                  .map((value) => discoveryLabels[value] || value)
                  .join(" · ")}
              </p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f2f2f2] px-2 py-1 text-xs font-bold text-ink">
            <Star className="h-3 w-3 fill-ink text-ink" />
            {store.rating || "Yeni"}
          </span>
        </div>
        {!compact && store.description && (
          <p className="mt-2 line-clamp-1 text-sm text-slate-500">
            {store.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {store.distanceKm != null && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {store.distanceKm} km
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Min. {store.effectiveMinPersonCount ?? store.minPersonCount} kişi
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">
            {store.nextAvailableDeliveryDate ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(store.nextAvailableDeliveryDate).toLocaleDateString("tr-TR")} itibarıyla
              </span>
            ) : (
              "Haftalık yemek planı"
            )}
          </span>
          <span className="shrink-0 text-sm font-semibold text-ink">
            {store.startingPrice
              ? `${store.startingPrice.toLocaleString("tr-TR")} ₺'den`
              : "Menüleri gör"}
          </span>
        </div>
      </div>
    </Link>
  );
}
