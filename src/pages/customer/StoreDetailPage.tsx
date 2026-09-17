import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Clock3,
  MapPin,
  Search,
  Star,
  Users,
} from "lucide-react";
import { storeService } from "@/services/storeService";
import { useCustomerAddress } from "@/contexts/CustomerAddressContext";
import FavoriteButton from "@/components/customer/FavoriteButton";
import type { Menu } from "@/types";
import { discoveryLabels } from "@/constants/discovery";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import MediaPlaceholder from "@/components/brand/MediaPlaceholder";

const dayLabels: Record<string, string> = {
  MONDAY: "Pazartesi",
  TUESDAY: "Salı",
  WEDNESDAY: "Çarşamba",
  THURSDAY: "Perşembe",
  FRIDAY: "Cuma",
  SATURDAY: "Cumartesi",
  SUNDAY: "Pazar",
};
const dayOrder = Object.keys(dayLabels);
const menuPhotos = (menu: Menu) =>
  menu.galleryImages?.length
    ? menu.galleryImages
    : menu.imageUrl
      ? [{ id: 0, imageUrl: menu.imageUrl, sortOrder: 0 }]
      : [];

function MenuCard({
  menu,
  disabled,
  selected,
  onSelect,
}: {
  menu: Menu;
  disabled: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`overflow-hidden rounded-2xl border bg-white transition ${selected ? "border-primary-500 ring-1 ring-primary-500" : "border-[#e7e7e7] hover:border-[#bdbdbd]"}`}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {menuPhotos(menu).length > 0 && (
            <div className="grid w-28 shrink-0 grid-cols-2 gap-1 overflow-hidden rounded-lg sm:w-32">
              {menuPhotos(menu)
                .slice(0, 4)
                .map((image, index) => (
                  <MediaPlaceholder
                    key={image.id || image.imageUrl}
                    src={image.imageUrl}
                    alt={`${menu.name} fotoğraf ${index + 1}`}
                    kind="menu"
                    className="overflow-hidden"
                  />
                ))}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-ink">{menu.name}</h3>
              <span className="rounded-full bg-[#fff1ef] px-2.5 py-1 text-[11px] font-bold text-[#c91400]">
                Haftalık
              </span>
            </div>
            {menu.description && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {menu.description}
              </p>
            )}
            {!!menu.dietTags?.length && (
              <div className="mt-3 flex flex-wrap gap-1">
                {menu.dietTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#fff1ef] px-2.5 py-1 text-[11px] font-bold text-[#c91400]"
                  >
                    {discoveryLabels[tag] || tag}
                  </span>
                ))}
              </div>
            )}
            {!!menu.allergens?.length && (
              <p className="mt-3 flex items-center gap-1 text-xs text-warning-700">
                <AlertCircle className="h-3.5 w-3.5" /> İçerir:{" "}
                {menu.allergens
                  .map((value) => discoveryLabels[value] || value)
                  .join(", ")}
              </p>
            )}
            {menu.allergenInfo && (
              <p className="mt-1 text-xs text-warning-700">
                Ek bilgi: {menu.allergenInfo}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-ink">
              {menu.pricePerPerson.toLocaleString("tr-TR")} ₺
            </p>
            <p className="text-xs text-slate-500">kişi / gün</p>
            {menu.priceEffectiveFrom && (
              <p className="mt-1 text-[11px] font-semibold text-warning-700">
                Fiyat geçerliliği:{" "}
                {new Date(
                  `${menu.priceEffectiveFrom}T00:00:00`,
                ).toLocaleDateString("tr-TR")}
              </p>
            )}
          </div>
        </div>
        <section className="customer-divider mt-5 border-t pt-4">
          <p className="text-sm font-semibold text-ink">Menüde yer alabilecek yemek çeşitleri</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Günlük menü üretim planına göre değişebilir.
          </p>
          {menu.items.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {menu.items.map((item) => (
                <span
                  key={item.id}
                  className="rounded-full bg-[#f2f2f2] px-3 py-1 text-xs font-semibold text-slate-700"
                  title={item.description || undefined}
                >
                  {item.name}
                  {item.description ? ` · ${item.description}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg bg-[#f7f7f7] px-3 py-2 text-xs text-slate-500">
              Yemek çeşitleri henüz paylaşılmadı.
            </p>
          )}
        </section>
        <div className="customer-divider mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <span className="text-xs font-semibold text-slate-500">Haftalık planınız için uygundur</span>
          {disabled ? (
            <span className="rounded-lg bg-[#f2f2f2] px-5 py-2.5 text-sm font-semibold text-slate-500">
              Şu anda talep alınmıyor
            </span>
          ) : (
            <Button
              type="button"
              onClick={onSelect}
              variant={selected ? "secondary" : "primary"}
              size="sm"
            >
              {selected ? "Seçildi" : "Menüyü seç"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const storeId = Number(id);
  const { activeAddress, activeAddressId } = useCustomerAddress();
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState<number>();
  const {
    data: store,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["store", storeId, activeAddressId],
    queryFn: () => storeService.getStore(storeId, activeAddressId),
    enabled: !!storeId,
  });
  const { data: menus = [] } = useQuery({
    queryKey: ["store-menus", storeId],
    queryFn: () => storeService.getMenus(storeId),
    enabled: !!storeId,
  });
  const { data: hours = [] } = useQuery({
    queryKey: ["store-hours", storeId],
    queryFn: () => storeService.getBusinessHours(storeId),
    enabled: !!storeId,
  });
  const { data: reviews } = useQuery({
    queryKey: ["customer-store-reviews", storeId],
    queryFn: () => storeService.getReviews(storeId),
    enabled: !!storeId,
  });
  const visibleMenus = menus.filter((menu) =>
    `${menu.name} ${menu.description || ""} ${menu.items.map((item) => item.name).join(" ")}`
      .toLocaleLowerCase("tr-TR")
      .includes(menuSearch.toLocaleLowerCase("tr-TR")),
  );
  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId);

  useEffect(() => {
    if (storeId) storeService.recordStoreView(storeId).catch(() => undefined);
  }, [storeId]);

  if (isLoading)
    return <div className="h-96 animate-pulse rounded-xl bg-[#eeeeee]" />;
  if (isError || !store)
    return (
      <div className="mf-page">
        <EmptyState
          title="Bu işletme şu anda görüntülenemiyor"
          description="İşletme seçili adresinize hizmet vermiyor veya artık aktif değil."
        />
      </div>
    );

  return (
    <div className="mf-page">
      <Link to="/stores" className="text-sm font-semibold text-primary-700">
        ← İşletmelere dön
      </Link>
      <section className="overflow-hidden rounded-3xl border border-[#e7e7e7] bg-white">
        <div className="relative h-64 bg-[#eeeeee] sm:h-80">
          <MediaPlaceholder src={store.coverImageUrl} alt="" kind="menu" fit="cover" />
          <div className="absolute right-4 top-4">
            <FavoriteButton storeId={store.id} />
          </div>
          {store.temporarilyClosed && (
            <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-5 py-3 text-center text-sm font-bold text-white">
              Bu işletme geçici olarak abonelik talebi almıyor.
            </div>
          )}
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="-mt-14 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border-4 border-white bg-white text-3xl shadow-card sm:-mt-16">
              <MediaPlaceholder
                src={store.logoUrl}
                alt=""
                kind="store"
                fallbackLabel={store.name}
                fit="contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="customer-display text-3xl text-ink sm:text-4xl">
                {store.name}
              </h1>
              {store.description && (
                <p className="mt-2 max-w-3xl leading-7 text-slate-600">
                  {store.description}
                </p>
              )}
              {!!store.categories?.length && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {store.categories.slice(0, 5).map((value) => (
                      <span
                        key={value}
                        className="rounded-full border border-[#e7e7e7] bg-[#f7f7f7] px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {discoveryLabels[value] || value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1 font-semibold text-ink">
                  <Star className="h-4 w-4 fill-[#dfaa5d] text-[#dfaa5d]" /> {store.rating} (
                  {store.reviewCount} değerlendirme)
                </span>
                {store.distanceKm != null && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="h-4 w-4" /> {store.distanceKm} km
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-600">
                  <Users className="h-4 w-4" /> Bu adres için min.{" "}
                  {store.effectiveMinPersonCount ?? store.minPersonCount} kişi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="customer-eyebrow">Bu hafta</p>
              <h2 className="customer-display mt-1 text-3xl text-ink">Abonelik menüleri</h2>
              <p className="mt-1 text-sm text-slate-500">
                Sunulan yemek çeşitlerini inceleyerek size uygun menüyü seçin.
              </p>
            </div>
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={menuSearch}
                onChange={(event) => setMenuSearch(event.target.value)}
                placeholder="Menüde ara"
                className="h-11 rounded-xl border border-[#d6d6d6] bg-[#f7f7f7] pl-9 pr-3 text-sm outline-none hover:border-[#ababab] focus:border-ink focus:bg-white"
              />
            </label>
          </div>
          <div className="space-y-4">
            {visibleMenus.length ? (
              visibleMenus.map((menu) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  disabled={store.temporarilyClosed}
                  selected={selectedMenuId === menu.id}
                  onSelect={() => setSelectedMenuId(menu.id)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-[#e7e7e7] bg-white p-10 text-center text-slate-500">
                Aramanıza uygun menü bulunamadı.
              </div>
            )}
          </div>
        </main>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {selectedMenu && (
            <div className="hidden rounded-2xl border border-[#e7e7e7] bg-white p-5 shadow-card lg:block">
              <p className="customer-eyebrow text-primary-700">
                Abonelik özeti
              </p>
              <h3 className="mt-2 font-semibold text-ink">{selectedMenu.name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {selectedMenu.pricePerPerson.toLocaleString("tr-TR")} ₺ kişi /
                gün
              </p>
              <Link
                to={`/subscribe?storeId=${storeId}&menuId=${selectedMenu.id}${activeAddressId ? `&addressId=${activeAddressId}` : ""}`}
                className="mt-4 block"
              >
                <Button className="w-full">Bu menüyle devam et</Button>
              </Link>
            </div>
          )}
          <div className="rounded-2xl border border-[#e7e7e7] bg-white p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <Clock3 className="h-5 w-5 text-primary-600" /> Çalışma saatleri
            </h3>
            <div className="mt-4 space-y-2">
              {dayOrder.map((day) => {
                const hour = hours.find((item) => item.dayOfWeek === day);
                return (
                  <div key={day} className="flex justify-between text-xs">
                    <span className="text-slate-500">{dayLabels[day]}</span>
                    <span
                      className={
                        hour?.open
                          ? "font-semibold text-slate-800"
                          : "text-danger-500"
                      }
                    >
                      {hour?.open
                        ? `${hour.openTime?.slice(0, 5)} – ${hour.closeTime?.slice(0, 5)}`
                        : "Kapalı"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e7e7e7] bg-white p-5">
            <h3 className="font-semibold">Teslimat bilgisi</h3>
            <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />{" "}
              {activeAddress
                ? `${activeAddress.title} · ${activeAddress.district}`
                : "Adres seçilmedi"}
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Users className="h-4 w-4 text-primary-600" /> Min.{" "}
              {store.effectiveMinPersonCount ?? store.minPersonCount} kişi
            </p>
            {store.nextAvailableDeliveryDate && (
              <p className="mt-3 rounded-lg bg-[#fff1ef] p-3 text-sm font-semibold text-[#c91400]">
                İlk uygun teslimat:{" "}
                {new Date(store.nextAvailableDeliveryDate).toLocaleDateString(
                  "tr-TR",
                )}
              </p>
            )}
            {!!store.availableDeliveryTimes?.length && (
              <div className="mt-3 flex flex-wrap gap-1">
                {store.availableDeliveryTimes.slice(0, 8).map((time) => (
                  <span
                    key={time}
                    className="rounded-full bg-[#f2f2f2] px-2.5 py-1 text-xs font-semibold"
                  >
                    {time.slice(0, 5)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {selectedMenu && !store.temporarilyClosed && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-floating backdrop-blur lg:hidden">
          <Link
            to={`/subscribe?storeId=${storeId}&menuId=${selectedMenu.id}${activeAddressId ? `&addressId=${activeAddressId}` : ""}`}
          >
            <Button className="w-full">
              {selectedMenu.name} ile devam et ·{" "}
              {selectedMenu.pricePerPerson.toLocaleString("tr-TR")} ₺ / kişi /
              gün
            </Button>
          </Link>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="customer-eyebrow">Deneyimler</p>
            <h2 className="customer-display mt-1 text-3xl text-ink">Müşteri değerlendirmeleri</h2>
            <p className="mt-1 text-sm text-slate-500">
              Bu işletmeden hizmet alan müşterilerin yorumları
            </p>
          </div>
        </div>
        {reviews?.content.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.content.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-[#e7e7e7] bg-white p-5"
              >
                <div className="flex justify-between">
                  <span className="font-bold">{review.customerName}</span>
                  <span className="text-sm text-warning-500">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {review.comment}
                  </p>
                )}
                {review.sellerReply && (
                  <div className="mt-4 rounded-2xl bg-[#f7f7f7] p-3">
                    <p className="text-xs font-bold text-slate-700">
                      İşletmenin yanıtı
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {review.sellerReply}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
            <div className="rounded-2xl border border-[#e7e7e7] bg-white p-8 text-center text-sm text-slate-500">
            Henüz değerlendirme yapılmamış.
          </div>
        )}
      </section>
    </div>
  );
}
