import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Flame,
  Globe2,
  Heart,
  Leaf,
  MapPin,
  RefreshCw,
  Search,
  Soup,
  UtensilsCrossed,
} from "lucide-react";
import { useCustomerAddress } from "@/contexts/CustomerAddressContext";
import { storeService } from "@/services/storeService";
import { subscriptionService } from "@/services/subscriptionService";
import StoreCard from "@/components/customer/StoreCard";
import { discoveryLabels } from "@/constants/discovery";

const categoryIcon = (category: string) => {
  if (category.includes("VEGAN") || category.includes("SAGLIK")) return Leaf;
  if (category.includes("IZGARA")) return Flame;
  if (category.includes("SULU") || category.includes("EV_YEMEK")) return Soup;
  if (category.includes("DUNYA")) return Globe2;
  return UtensilsCrossed;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { activeAddress, activeAddressId, isLoading: addressLoading } =
    useCustomerAddress();
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
    ["PAYMENT_PENDING", "APPROVED", "ACTIVE", "PAYMENT_SUSPENDED"].includes(item.status),
  );
  const completed = subscriptions?.content.find((item) => item.status === "COMPLETED");

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!activeAddressId) return navigate("/addresses");
    navigate(`/stores${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`);
  };

  if (addressLoading) return <div className="h-80 animate-pulse rounded-2xl bg-[#eeeeee]" />;

  return (
    <div className="space-y-10 lg:space-y-14">
      <section className="grid overflow-hidden rounded-3xl bg-[#fff0ed] text-ink lg:min-h-[430px] lg:grid-cols-[1.04fr_.96fr]">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-primary-600">
            Haftalık yemek, iyi plan
          </p>
          <h1 className="customer-display mt-4 max-w-xl text-[2.45rem] leading-[1.07] sm:text-[3.6rem] lg:text-[4rem]">
            Öğle arası için iyi bir plan.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
            Yakınınızdaki mutfakları keşfedin. Haftalık menünüzü seçin; yemeğiniz
            her gün iş yerinize gelsin.
          </p>
          <form onSubmit={submitSearch} className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl border border-[#e7e7e7] bg-white p-1.5 text-ink shadow-card">
            <Search className="ml-3 h-5 w-5 shrink-0 text-slate-500" />
            <input
              aria-label="İşletme veya menü ara"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Bugün ne yemek istersiniz?"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-slate-400 sm:text-base"
            />
            <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white transition hover:bg-primary-700">
              Ara <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            {activeAddress
              ? `${activeAddress.title} · ${activeAddress.district} için gösteriliyor`
              : "Yakınınızdaki mutfaklar için teslimat adresi ekleyin"}
          </p>
        </div>
        <div className="relative min-h-56 overflow-hidden bg-[#eeeeee] lg:min-h-full">
          <img
            src="/images/login-meal-hero.jpg"
            alt="Hazırlanmış yemekler ve salata"
            className="absolute inset-0 h-full w-full object-cover object-[67%_55%]"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
          <span className="absolute bottom-5 left-5 text-xs font-medium text-white sm:left-8">
            Her güne farklı bir sofra
          </span>
        </div>
      </section>

      {!activeAddress && (
        <section className="flex flex-col gap-4 rounded-2xl border border-[#e7e7e7] bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Önce teslimat adresinizi ekleyin</h2>
            <p className="mt-1 text-sm text-slate-600">Size hizmet veren işletmeleri adresinize göre göstereceğiz.</p>
          </div>
          <Link to="/addresses" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            Adres Ekle
          </Link>
        </section>
      )}

      {ongoing && (
        <Link
          to={`/subscriptions/${ongoing.id}`}
          className="group flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50 px-5 py-4 transition hover:border-primary-300 sm:flex-row sm:items-center"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-600 text-white">
            <CalendarDays className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="customer-eyebrow block">Planınız devam ediyor</span>
            <span className="mt-1 block text-base font-semibold text-ink">
              {ongoing.storeName} · {ongoing.menuName}
            </span>
            <span className="mt-0.5 block text-sm text-slate-600">
              {ongoing.nextDeliveryDate
                ? `Sıradaki teslimat ${new Date(ongoing.nextDeliveryDate).toLocaleDateString("tr-TR")}`
                : "Teslimat planınızı görüntüleyin"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-700">
            Planı gör <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}

      {completed && (
        <Link
          to={`/subscriptions/${completed.id}`}
          className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#e7e7e7] bg-white px-5 py-4 transition hover:border-primary-300"
        >
          <RefreshCw className="h-5 w-5 text-primary-700" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">{completed.storeName} ile yeniden planlayın</span>
            <span className="mt-0.5 block text-sm text-slate-600">Önceki aboneliğiniz tamamlandı. Güncel menüyü inceleyin.</span>
          </span>
          <ArrowRight className="h-4 w-4 text-primary-700" />
        </Link>
      )}

      {!!metadata?.categories.length && (
        <section aria-labelledby="category-heading">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="customer-eyebrow">Canınız ne çekiyor?</p>
              <h2 id="category-heading" className="customer-display mt-1 text-3xl leading-tight text-ink sm:text-4xl">
                Damak tadınıza göre keşfedin
              </h2>
            </div>
            <Link to="/stores" className="hidden items-center gap-1 text-sm font-semibold text-primary-700 hover:underline sm:inline-flex">
              Tüm mutfaklar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Mutfak kategorileri">
            {metadata.categories.slice(0, 8).map((category) => {
              const Icon = categoryIcon(category);
              return (
                <Link
                  key={category}
                  to={`/stores?category=${category}`}
                  className="inline-flex min-h-12 shrink-0 items-center gap-2.5 rounded-full border border-[#e7e7e7] bg-white px-5 text-sm font-bold text-ink transition hover:border-primary-300 hover:bg-primary-50"
                >
                  <Icon className="h-4 w-4 text-primary-600" />
                  {discoveryLabels[category] || category}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {activeAddressId && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="customer-eyebrow">Yakınınızda</p>
              <h2 className="customer-display mt-1 text-3xl leading-tight text-ink sm:text-4xl">
                Size hizmet veren işletmeler
              </h2>
              <p className="mt-2 text-sm text-slate-600">İş yerinize teslimat yapan mutfakların haftalık menülerine göz atın.</p>
            </div>
            <Link to="/stores" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-700 hover:underline">
              Tümünü gör <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {storesLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-[#eeeeee]" />)}
            </div>
          ) : stores?.content.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stores.content.map((store) => <StoreCard key={store.id} store={store} addressId={activeAddressId} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#e7e7e7] bg-white p-10 text-center text-slate-600">
              Bu adrese hizmet veren aktif işletme bulunamadı.
            </div>
          )}
        </section>
      )}

      {!!recent.length && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="customer-eyebrow">Kaldığınız yerden</p>
              <h2 className="customer-display mt-1 text-3xl leading-tight text-ink">Son baktığınız mutfaklar</h2>
            </div>
            <Link to="/favorites" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
              Favoriler <Heart className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recent.slice(0, 4).map((store) => <StoreCard key={store.id} store={store} addressId={activeAddressId} compact />)}
          </div>
        </section>
      )}

      <section className="customer-divider grid gap-6 border-t py-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-10">
        <div>
          <p className="customer-eyebrow">MealFlex nasıl çalışır?</p>
          <h2 className="customer-display mt-2 text-2xl leading-tight text-ink sm:text-3xl">İyi yemek, kolay bir rutin.</h2>
        </div>
        <div className="grid gap-5 text-sm leading-6 text-slate-600 sm:grid-cols-3">
          <p><strong className="mb-1 block font-semibold text-ink">01 · Mutfağınızı seçin</strong>Size yakın işletmeleri ve menülerini karşılaştırın.</p>
          <p><strong className="mb-1 block font-semibold text-ink">02 · Haftayı planlayın</strong>Günleri, kişi sayısını ve teslimat saatini belirleyin.</p>
          <p><strong className="mb-1 block font-semibold text-ink">03 · Yemeğinizi bekleyin</strong>Satıcı onayından sonra teslimatları hesabınızdan takip edin.</p>
        </div>
      </section>
    </div>
  );
}
