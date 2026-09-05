import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { adminService } from "@/services/adminService";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import QueryBoundary from "@/components/ui/QueryBoundary";
import StatusBadge from "@/components/ui/StatusBadge";
import { storeStatuses, uiStatus } from "@/constants/statuses";

export default function AdminStoresPage() {
  const [urlParams, setUrlParams] = useSearchParams();
  const [page, setPage] = useState(Math.max(0, Number(urlParams.get("page") || 0)));
  const [searchInput, setSearchInput] = useState(urlParams.get("search") || "");
  const [search, setSearch] = useState(urlParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(urlParams.get("status") || "");
  const [sort, setSort] = useState<"name" | "rating" | "status">(
    (urlParams.get("sort") as "name" | "rating" | "status") || "name",
  );
  const [showMinPerson, setShowMinPerson] = useState(true);
  const [showRating, setShowRating] = useState(true);
  useEffect(() => {
    const next = new URLSearchParams();
    if (statusFilter) next.set("status", statusFilter);
    if (search) next.set("search", search);
    if (sort !== "name") next.set("sort", sort);
    if (page > 0) next.set("page", String(page));
    setUrlParams(next, { replace: true });
  }, [page, search, setUrlParams, sort, statusFilter]);
  const sortParam =
    sort === "rating"
      ? "rating,desc"
      : sort === "status"
        ? "status,asc"
        : "name,asc";
  const storesQuery = useQuery({
    queryKey: ["admin-stores", page, statusFilter, search, sortParam],
    queryFn: () =>
      adminService.getStores(
        page,
        20,
        statusFilter || undefined,
        search || undefined,
        sortParam,
      ),
  });
  const data = storesQuery.data;

  const visibleStores = data?.content || [];
  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setSort("name");
    setPage(0);
  };

  return (
    <div className="mf-page space-y-6">
      <PageHeader
        eyebrow="Platform yönetimi"
        title="Mağazalar"
        description="Mağaza durumlarını, puanlarını ve başvuru süreçlerini tek yerden takip edin."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(searchInput.trim());
          setPage(0);
        }}
        className="mf-surface flex flex-wrap items-center gap-2 p-3"
      >
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Mağaza adı ara"
          className="mf-input min-w-56 flex-1"
          aria-label="Mağaza ara"
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(0);
          }}
          className="mf-input w-auto"
          aria-label="Mağaza durum filtresi"
        >
          <option value="">Tüm durumlar</option>
          {Object.entries(storeStatuses).map(([value, def]) => (
            <option key={value} value={value}>
              {def.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as typeof sort);
            setPage(0);
          }}
          className="mf-input w-auto"
          aria-label="Mağaza sıralaması"
        >
          <option value="name">Ada göre sırala</option>
          <option value="rating">Puana göre sırala</option>
          <option value="status">Duruma göre sırala</option>
        </select>
        <details className="relative">
          <summary className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
            Sütunlar
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-floating">
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={showMinPerson}
                onChange={(event) => setShowMinPerson(event.target.checked)}
              />
              Minimum kişi
            </label>
            <label className="mt-2 flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={showRating}
                onChange={(event) => setShowRating(event.target.checked)}
              />
              Puan
            </label>
          </div>
        </details>
        <Button type="submit" size="sm">
          Ara
        </Button>
        {(statusFilter || search || sort !== "name") && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Filtreleri temizle
          </Button>
        )}
      </form>

      {data && (
        <p className="text-xs font-semibold text-slate-500">
          {data.totalElements} mağaza bulundu
          {data.totalPages > 1 ? ` · ${data.number + 1}. sayfa` : ""}
        </p>
      )}

      <QueryBoundary
        query={storesQuery}
        loadingLabel="Mağazalar yükleniyor…"
        errorTitle="Mağazalar yüklenemedi"
        isEmpty={(result) => result.content.length === 0}
        emptyTitle="Mağaza bulunamadı"
        emptyDescription="Arama veya durum filtresini değiştirerek tekrar deneyin."
        emptyAction={
          statusFilter || search ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Filtreleri temizle
            </Button>
          ) : undefined
        }
      >
        {() => (
          <>
            <div className="mf-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        ID
                      </th>
                      <th className="px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        Mağaza adı
                      </th>
                      {showMinPerson && (
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                          Minimum kişi
                        </th>
                      )}
                      {showRating && (
                        <th className="px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                          Puan
                        </th>
                      )}
                      <th className="px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleStores.map((store) => (
                      <tr
                        key={store.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4 text-sm text-slate-500">
                          #{store.id}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-ink">
                          {store.name}
                        </td>
                        {showMinPerson && (
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {store.minPersonCount}
                          </td>
                        )}
                        {showRating && (
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {store.rating} ({store.reviewCount})
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <StatusBadge
                            tone={uiStatus(storeStatuses, store.status).tone}
                          >
                            {uiStatus(storeStatuses, store.status).label}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/admin/stores/${store.id}`}
                            className="text-sm font-bold text-primary-600 hover:text-primary-800"
                          >
                            Detay
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  disabled={data.first}
                  variant="outline"
                  size="sm"
                >
                  Önceki
                </Button>
                <label className="text-sm text-slate-600">
                  Sayfa
                  <select aria-label="Mağaza sayfası" value={data.number} onChange={(event) => setPage(Number(event.target.value))} className="mf-input ml-2 w-auto py-1.5">
                    {Array.from({ length: data.totalPages }, (_, index) => <option key={index} value={index}>{index + 1}</option>)}
                  </select>
                  <span className="ml-2">/ {data.totalPages}</span>
                </label>
                <Button
                  onClick={() => setPage((value) => value + 1)}
                  disabled={data.last}
                  variant="outline"
                  size="sm"
                >
                  Sonraki
                </Button>
              </div>
            )}
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
