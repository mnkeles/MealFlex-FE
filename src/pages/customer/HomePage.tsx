import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  Store as StoreIcon,
  UtensilsCrossed,
} from "lucide-react";
import { useCustomerAddress } from "@/contexts/CustomerAddressContext";
import { storeService } from "@/services/storeService";
import { subscriptionService } from "@/services/subscriptionService";
import StoreCard from "@/components/customer/StoreCard";
import { discoveryLabels } from "@/constants/discovery";

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const {
    activeAddress,
    activeAddressId,
    isLoading: addressLoading,
  } = useCustomerAddress();
  const { data: stores, isLoading: storesLoading } = useQuery({
    queryKey: ["home-stores", activeAddressId],
    queryFn: () => storeService.getStores(activeAddressId!, { size: 6 }),
    enabled: !!activeAddressId,
  });
  const { data: subscriptions } = useQuery({
    queryKey: ["subscriptions", "home"],
    queryFn: () => subscriptionService.getMySubscriptions(undefined, 0, 20),
  });
  const { data: metadata } = useQuery({
    queryKey: ["discovery-metadata"],
    queryFn: storeService.getDiscoveryMetadata,
  });
  const { data: recent = [] } = useQuery({
    queryKey: ["recent-stores", activeAddressId],
    queryFn: () => storeService.getRecentStores(activeAddressId!),
    enabled: !!activeAddressId,
  });
  const ongoing = subscriptions?.content.find((item) =>
    ["APPROVED", "ACTIVE", "PAYMENT_SUSPENDED"].includes(item.status),
  );
  const completed = subscriptions?.content.find(
    (item) => item.status === "COMPLETED",
  );

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!activeAddressId) return navigate("/addresses");
    navigate(
      `/stores${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`,
    );
  };

  if (addressLoading)
    return <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-danger-600 to-warning-500 px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-16">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-warning-200/25 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-warning-100">
            <MapPin className="h-4 w-4" />{" "}
            {activeAddress
              ? `${activeAddress.title} · ${activeAddress.district}`
              : "Teslimat adresinizi seçin"}
          </span>
          <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl">
            İş yeriniz için her gün
            <br />
            <span className="text-warning-200">iyi yemek, tek abonelik.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
            Adresinize hizmet veren güvenilir işletmeleri keşfedin, haftalık
            menüyü seçin ve öğünlerinizi planlayın.
          </p>
          <form
            onSubmit={submitSearch}
            className="mt-8 flex max-w-2xl gap-2 rounded-2xl bg-white p-2 shadow-2xl"
          >
            <Search className="ml-3 mt-3 h-5 w-5 shrink-0 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="İşletme veya menü ara"
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none sm:text-base"
            />
            <button className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white hover:bg-primary-700">
              Keşfet
            </button>
          </form>
        </div>
      </section>

      {!activeAddress && (
        <section className="rounded-2xl border border-dashed border-primary-300 bg-primary-50 p-8 text-center">
          <MapPin className="mx-auto h-10 w-10 text-primary-600" />
          <h2 className="mt-3 text-xl font-bold">
            Önce teslimat adresinizi ekleyin
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Yalnızca adresinize gerçekten hizmet veren işletmeleri göstereceğiz.
          </p>
          <Link
            to="/addresses"
            className="mt-5 inline-flex rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white"
          >
            Adres Ekle
          </Link>
        </section>
      )}

      {!!metadata?.categories.length && (
        <section aria-labelledby="category-heading">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-primary-600">
                Hızlı keşif
              </p>
              <h2
                id="category-heading"
                className="mt-1 text-xl font-black text-ink"
              >
                Ne arıyorsunuz?
              </h2>
            </div>
            <Link
              to="/stores"
              className="text-sm font-bold text-primary-700 hover:underline"
            >
              Tüm filtreler
            </Link>
          </div>
          <div
            className="mt-4 flex gap-3 overflow-x-auto pb-2"
            aria-label="Mutfak kategorileri"
          >
            {metadata.categories.slice(0, 8).map((category) => (
              <Link
                key={category}
                to={`/stores?category=${category}`}
                className="flex min-w-28 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-mf-xs transition hover:border-primary-300 hover:bg-primary-50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-50 text-lg">
                  🍽️
                </span>
                <span className="mt-3 text-sm font-black text-ink">
                  {discoveryLabels[category] || category}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {ongoing && (
        <Link
          to={`/subscriptions/${ongoing.id}`}
          className="flex flex-col gap-4 rounded-2xl border border-success-200 bg-success-50 p-5 transition hover:shadow-md sm:flex-row sm:items-center"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-success-600 text-white">
            <CalendarCheck />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-success-700">
              Devam eden abonelik
            </p>
            <h2 className="font-bold text-slate-900">
              {ongoing.storeName} · {ongoing.menuName}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {ongoing.nextDeliveryDate
                ? `Sıradaki teslimat: ${new Date(ongoing.nextDeliveryDate).toLocaleDateString("tr-TR")}`
                : "Teslimat planını görüntüleyin"}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-success-700" />
        </Link>
      )}

      {completed && (
        <Link
          to={`/subscriptions/${completed.id}`}
          className="flex flex-wrap items-center gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-5 transition hover:border-primary-300"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-600 text-white">
            <RefreshCw className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-black uppercase tracking-wide text-primary-700">
              Yeniden abonelik
            </span>
            <span className="mt-1 block font-black text-ink">
              {completed.storeName} menüsünü yeniden oluşturun
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Önceki aboneliğiniz tamamlandı; ayrıntılardan güncel menüyü
              seçebilirsiniz.
            </span>
          </span>
          <ArrowRight className="h-5 w-5 text-primary-700" />
        </Link>
      )}

      {activeAddressId && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-primary-600">
                ADRESİNİZE UYGUN
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                Size hizmet veren işletmeler
              </h2>
            </div>
            <Link
              to="/stores"
              className="flex items-center gap-1 text-sm font-bold text-primary-600"
            >
              Tümünü gör <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {storesLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : stores?.content.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stores.content.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  addressId={activeAddressId}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center text-slate-500">
              Bu adrese hizmet veren aktif işletme bulunamadı.
            </div>
          )}
        </section>
      )}

      {!!recent.length && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-primary-600">
                Sizin için
              </p>
              <h2 className="mt-1 text-xl font-black text-ink">
                Son görüntüledikleriniz
              </h2>
            </div>
            <Link
              to="/favorites"
              className="flex items-center gap-1 text-sm font-bold text-primary-700"
            >
              Favoriler <Heart className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recent.slice(0, 4).map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                addressId={activeAddressId}
                compact
              />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-7 shadow-sm sm:p-10">
        <div className="text-center">
          <p className="text-sm font-bold text-primary-600">NASIL ÇALIŞIR?</p>
          <h2 className="mt-2 text-2xl font-black">
            Üç adımda öğünlerinizi planlayın
          </h2>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            [
              StoreIcon,
              "İşletmeni seç",
              "Adresinize hizmet veren işletmeleri ve gerçek müşteri yorumlarını karşılaştırın.",
            ],
            [
              UtensilsCrossed,
              "Haftalık menüyü incele",
              "Gün gün yemek programını görün ve size uygun menüyü seçin.",
            ],
            [
              CheckCircle2,
              "Talebini gönder",
              "Kişi ve tarih bilgilerini belirleyin; satıcı onayından sonra aboneliğiniz başlasın.",
            ],
          ].map(([Icon, title, text], index) => {
            const ItemIcon = Icon as typeof StoreIcon;
            return (
              <div
                key={String(title)}
                className="relative rounded-2xl bg-slate-50 p-6"
              >
                <span className="absolute right-5 top-4 text-4xl font-black text-slate-200">
                  0{index + 1}
                </span>
                <ItemIcon className="h-8 w-8 text-primary-600" />
                <h3 className="mt-5 font-bold">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {String(text)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
