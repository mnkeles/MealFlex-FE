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
      className="group block overflow-hidden rounded-xl border border-[#e6e1d8] bg-white transition hover:border-[#cfc4b6] hover:shadow-card"
    >
      <div className={`relative overflow-hidden bg-[#eee7db] ${compact ? "h-36" : "h-48"}`}>
        <MediaPlaceholder
          src={store.coverImageUrl}
          alt=""
          kind="menu"
          fit="cover"
          imageClassName="transition duration-500 group-hover:scale-[1.035]"
        />
        <FavoriteButton storeId={store.id} className="absolute right-3 top-3" />
        {store.temporarilyClosed && (
          <span className="absolute bottom-3 left-3 rounded-md bg-[#252a24]/90 px-3 py-1.5 text-xs font-semibold text-white">
            Geçici olarak kapalı
          </span>
        )}
      </div>
      <div className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e9e5dc] bg-[#faf8f4]">
            <MediaPlaceholder
              src={store.logoUrl}
              alt=""
              kind="store"
              fallbackLabel={store.name}
              fit="contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-base font-semibold tracking-tight text-ink">
                {store.name}
              </h3>
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#968f82] transition group-hover:text-primary-700" />
            </div>
            {!!store.categories?.length && (
              <p className="mt-0.5 line-clamp-1 text-xs text-[#776e62]">
                {store.categories
                  .slice(0, 3)
                  .map((value) => discoveryLabels[value] || value)
                  .join(" · ")}
              </p>
            )}
          </div>
        </div>
        {!compact && store.description && (
          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
            {store.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            <Star className="h-3.5 w-3.5 fill-[#dfaa5d] text-[#dfaa5d]" />
            {store.rating || "Yeni"}
          </span>
          {store.distanceKm != null && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {store.distanceKm} km
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Min. {store.effectiveMinPersonCount ?? store.minPersonCount} kişi
          </span>
        </div>
        <div className="customer-divider mt-4 flex items-center justify-between gap-2 border-t pt-3.5">
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
