import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import QueryBoundary from "@/components/ui/QueryBoundary";
import api from "@/services/api";
import { useCustomerAddress } from "@/contexts/CustomerAddressContext";
import type { Page } from "@/types";

interface Favorite {
  id: number;
  storeId: number;
  storeName: string;
  logoUrl?: string;
  coverImageUrl?: string;
  storeRating: number;
  storeMinPerson: number;
  temporarilyClosed: boolean;
}

function FavoriteCard({
  item,
  addressId,
  onRemove,
}: {
  item: Favorite;
  addressId?: number;
  onRemove: (storeId: number) => void;
}) {
  return (
    <Link
      to={`/stores/${item.storeId}${addressId ? `?addressId=${addressId}` : ""}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-36 bg-slate-100">
        {item.coverImageUrl ? (
          <img
            src={item.coverImageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">🍲</div>
        )}
        <button
          type="button"
          aria-label={`${item.storeName} işletmesini favorilerden çıkar`}
          onClick={(event) => {
            event.preventDefault();
            onRemove(item.storeId);
          }}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-primary-600 shadow"
        >
          <Heart className="h-5 w-5 fill-primary-600" aria-hidden="true" />
        </button>
        {item.temporarilyClosed && (
          <span className="absolute inset-x-3 bottom-3 rounded-lg bg-slate-900/85 p-2 text-center text-xs font-bold text-white">
            Geçici olarak kapalı
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-slate-100">
            {item.logoUrl ? (
              <img
                src={item.logoUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain"
              />
            ) : (
              "🍽️"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold group-hover:text-primary-600">
              {item.storeName}
            </h2>
            <div className="mt-1 flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Star
                  className="h-3 w-3 fill-warning-400 text-warning-400"
                  aria-hidden="true"
                />{" "}
                {item.storeRating}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" aria-hidden="true" /> Min.{" "}
                {item.storeMinPerson}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const { activeAddressId } = useCustomerAddress();
  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: async () =>
      (await api.get<Page<Favorite>>("/v1/favorites", { params: { size: 50 } }))
        .data,
  });
  const remove = useMutation({
    mutationFn: async (storeId: number) =>
      api.delete(`/v1/favorites/${storeId}`),
    onSuccess: (_, storeId) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.setQueryData(["favorite-check", storeId], false);
    },
  });

  return (
    <div>
      <p className="text-sm font-bold text-primary-600">KAYDETTİKLERİNİZ</p>
      <h1 className="mt-1 text-3xl font-semibold">Favori işletmelerim</h1>
      <p className="mt-2 text-slate-500">
        Beğendiğiniz işletmelere hızlıca ulaşın.
      </p>
      <div className="mt-7">
        <QueryBoundary
          query={query}
          loadingFallback={
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-xl bg-slate-200"
                />
              ))}
            </div>
          }
          errorTitle="Favoriler yüklenemedi"
          isEmpty={(data) => data.content.length === 0}
          emptyTitle="Henüz favori işletmeniz yok"
          emptyAction={
            <Link to="/stores" className="text-sm font-bold text-primary-600">
              İşletmeleri keşfet
            </Link>
          }
          emptyIcon={<Heart className="h-6 w-6" />}
        >
          {(data) => (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.content.map((item) => (
                <FavoriteCard
                  key={item.id}
                  item={item}
                  addressId={activeAddressId}
                  onRemove={(storeId) => remove.mutate(storeId)}
                />
              ))}
            </div>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
}
