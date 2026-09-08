import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BellRing, History, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { storeService, type StoreFilters } from "@/services/storeService";
import { useCustomerAddress } from "@/contexts/CustomerAddressContext";
import StoreCard from "@/components/customer/StoreCard";
import { discoveryLabels } from "@/constants/discovery";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";

export default function StoreListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeAddress, activeAddressId } = useCustomerAddress();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sort, setSort] = useState<StoreFilters["sort"]>(
    (searchParams.get("sort") as StoreFilters["sort"]) || "recommended",
  );
  const [minRating, setMinRating] = useState(
    searchParams.get("minRating") || "",
  );
  const [maxMinimum, setMaxMinimum] = useState(
    searchParams.get("maxMinimum") || "",
  );
  const [openOnly, setOpenOnly] = useState(
    searchParams.get("openOnly") === "true",
  );
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 0));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (sort && sort !== "recommended") params.set("sort", sort);
    if (minRating) params.set("minRating", minRating);
    if (maxMinimum) params.set("maxMinimum", maxMinimum);
    if (openOnly) params.set("openOnly", "true");
    if (category) params.set("category", category);
    if (page) params.set("page", String(page));
    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    sort,
    minRating,
    maxMinimum,
    openOnly,
    category,
    page,
    setSearchParams,
  ]);

  const filters: StoreFilters = {
    search: debouncedSearch.trim() || undefined,
    sort,
    minRating: minRating ? Number(minRating) : undefined,
    maxMinPersonCount: maxMinimum ? Number(maxMinimum) : undefined,
    openOnly,
    category: category || undefined,
    page,
    size: 12,
  };
  const { data: metadata } = useQuery({
    queryKey: ["discovery-metadata"],
    queryFn: storeService.getDiscoveryMetadata,
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["stores", activeAddressId, filters],
    queryFn: () => storeService.getStores(activeAddressId!, filters),
    enabled: !!activeAddressId,
  });
  const { data: recent = [] } = useQuery({
    queryKey: ["recent-stores", activeAddressId],
    queryFn: () => storeService.getRecentStores(activeAddressId!),
    enabled: !!activeAddressId,
  });
  const demandMutation = useMutation({
    mutationFn: () => storeService.registerServiceDemand(activeAddressId!),
  });

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSort("recommended");
    setMinRating("");
    setMaxMinimum("");
    setOpenOnly(false);
    setCategory("");
    setPage(0);
  };
  const resetPage = () => setPage(0);
  const activeFilters = [
    {
      value: category,
      label: category ? discoveryLabels[category] || category : "",
    },
    { value: minRating, label: minRating ? `${minRating}+ puan` : "" },
    {
      value: maxMinimum,
      label: maxMinimum ? `${maxMinimum} kişiye kadar` : "",
    },
    { value: openOnly, label: openOnly ? "Yalnızca açık" : "" },
  ].filter((item) => !!item.value);
  const isUnfilteredEmpty = !debouncedSearch.trim() && !activeFilters.length;

  const filterControls = (
    <>
      <select
        aria-label="Mutfak kategorisi"
        value={category}
        onChange={(event) => {
          setCategory(event.target.value);
          resetPage();
        }}
        className="mf-input w-full"
      >
        <option value="">Tüm mutfaklar</option>
        {metadata?.categories.map((value) => (
          <option key={value} value={value}>
            {discoveryLabels[value] || value}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(event) => {
          setSort(event.target.value as StoreFilters["sort"]);
          resetPage();
        }}
        className="mf-input w-full"
      >
        <option value="recommended">Önerilen sıralama</option>
        <option value="distance">En yakın</option>
        <option value="rating">En yüksek puan</option>
        <option value="price">En düşük fiyat</option>
        <option value="minimum">En düşük kişi limiti</option>
      </select>
      <select
        value={minRating}
        onChange={(event) => {
          setMinRating(event.target.value);
          resetPage();
        }}
        className="mf-input w-full"
      >
        <option value="">Tüm puanlar</option>
        <option value="4">4+ puan</option>
        <option value="3">3+ puan</option>
      </select>
      <select
        value={maxMinimum}
        onChange={(event) => {
          setMaxMinimum(event.target.value);
          resetPage();
        }}
        className="mf-input w-full"
      >
        <option value="">Kişi limiti</option>
        <option value="10">10 kişiye kadar</option>
        <option value="20">20 kişiye kadar</option>
        <option value="30">30 kişiye kadar</option>
        <option value="50">50 kişiye kadar</option>
      </select>
      <button
        type="button"
        onClick={() => {
          setOpenOnly((value) => !value);
          resetPage();
        }}
        className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold ${openOnly ? "border-primary-300 bg-primary-50 text-primary-700" : "border-slate-200 text-slate-600"}`}
      >
        <SlidersHorizontal className="h-4 w-4" /> Yalnızca açık
      </button>
    </>
  );

  if (!activeAddressId)
    return (
      <div className="mf-page">
        <EmptyState
          title="Önce teslimat adresinizi seçin"
          description="İşletmeleri yalnız seçtiğiniz teslimat adresine göre gösterebiliriz."
          icon={<MapPin className="h-6 w-6" />}
          action={
            <Link to="/addresses">
              <Button>Adreslerime git</Button>
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="mf-page">
      <PageHeader
        eyebrow="Keşfet"
        title="Size hizmet veren işletmeler"
        description="Mesafe, kategori, puan ve kişi limitine göre işletmeleri karşılaştırın."
      >
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-sm font-bold text-primary-700">
          <MapPin className="h-4 w-4" />
          {activeAddress?.title} · {activeAddress?.district}
        </div>
      </PageHeader>

      {!!recent.length && !search && !category && (
          <section className="mb-7">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
              <History className="h-5 w-5 text-primary-600" /> Son
              görüntüledikleriniz
            </h2>
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

      <div className="mf-surface p-4">
        <div className="flex flex-col gap-3">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
              placeholder="İşletme veya menü ara"
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <div className="hidden grid-cols-2 gap-2 lg:grid lg:grid-cols-4">
            {filterControls}
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl px-3 text-sm font-bold text-primary-600 transition hover:bg-primary-50"
            >
              Temizle
            </button>
          </div>
          <Button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            variant="outline"
            className="lg:hidden"
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          >
            Filtreler{activeFilters.length ? ` (${activeFilters.length})` : ""}
          </Button>
        </div>
      </div>

      {!!activeFilters.length && (
        <div className="flex flex-wrap gap-2" aria-label="Etkin filtreler">
          {activeFilters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => {
                if (filter.value === category) setCategory("");
                else if (filter.value === minRating) setMinRating("");
                else if (filter.value === maxMinimum) setMaxMinimum("");
                else setOpenOnly(false);
                resetPage();
              }}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary-50 px-3 text-xs font-bold text-primary-700"
            >
              {filter.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="İşletmeler yüklenemedi"
          description="Bağlantınızı kontrol ederek tekrar deneyin."
        />
      ) : !data?.content.length ? (
        isUnfilteredEmpty ? (
          <EmptyState
            title="Bu bölgeye henüz hizmet veren işletme yok"
            description={
              demandMutation.isSuccess
                ? "Talebinizi aldık. Bölgenizde hizmet başladığında size bildireceğiz."
                : `${activeAddress?.district || "Seçili bölgeniz"} için talep bırakarak yeni hizmet planlamasına katkıda bulunabilirsiniz.`
            }
            icon={<BellRing className="h-6 w-6" />}
            action={
              demandMutation.isSuccess ? undefined : (
                <Button
                  onClick={() => demandMutation.mutate()}
                  disabled={demandMutation.isPending}
                >
                  {demandMutation.isPending
                    ? "Talep kaydediliyor…"
                    : "Bölgenize hizmet başladığında haber ver"}
                </Button>
              )
            }
          />
        ) : (
          <EmptyState
            title="Filtrelerinize uygun işletme bulunamadı"
            description="Farklı bir arama, kategori, puan veya kişi limiti deneyebilirsiniz."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Filtreleri temizle
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              <strong className="text-ink">{data.totalElements}</strong> işletme
              bulundu
            </p>
            <span className="text-xs font-bold text-slate-500">
              Adresinize göre sıralandı
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.content.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                addressId={activeAddressId}
              />
            ))}
          </div>
        </>
      )}
      {demandMutation.isError && (
        <p role="alert" className="text-center text-sm font-semibold text-danger-700">
          Hizmet talebi kaydedilemedi. Lütfen tekrar deneyin.
        </p>
      )}
      {!!data && data.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            disabled={data.first}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Önceki
          </button>
          <span className="text-sm text-slate-500">
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            disabled={data.last}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Sonraki
          </button>
        </div>
      )}
      <Drawer
        open={mobileFiltersOpen}
        title="Filtrele ve sırala"
        onClose={() => setMobileFiltersOpen(false)}
      >
        <div className="grid gap-3">
          {filterControls}
          <Button
            type="button"
            onClick={() => {
              clearFilters();
              setMobileFiltersOpen(false);
            }}
            variant="ghost"
          >
            Filtreleri temizle
          </Button>
          <Button type="button" onClick={() => setMobileFiltersOpen(false)}>
            Sonuçları göster
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
