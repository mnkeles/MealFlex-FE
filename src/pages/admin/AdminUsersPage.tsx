import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import QueryBoundary from "@/components/ui/QueryBoundary";

const roleLabels: Record<string, string> = {
  CUSTOMER: "Müşteri",
  SELLER: "Satıcı",
  ADMIN: "Admin",
};

export default function AdminUsersPage() {
  const [urlParams, setUrlParams] = useSearchParams();
  const [roleFilter, setRoleFilter] = useState<string>(urlParams.get("role") || "");
  const [page, setPage] = useState(Math.max(0, Number(urlParams.get("page") || 0)));
  const [searchInput, setSearchInput] = useState(urlParams.get("search") || "");
  const [search, setSearch] = useState(urlParams.get("search") || "");
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [sort, setSort] = useState<"name" | "role" | "status">(
    (urlParams.get("sort") as "name" | "role" | "status") || "name",
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (roleFilter) next.set("role", roleFilter);
    if (search) next.set("search", search);
    if (sort !== "name") next.set("sort", sort);
    if (page > 0) next.set("page", String(page));
    setUrlParams(next, { replace: true });
  }, [page, roleFilter, search, setUrlParams, sort]);

  const sortParam =
    sort === "role"
      ? "role,asc"
      : sort === "status"
        ? "active,desc"
        : "firstName,asc";
  const usersQuery = useQuery({
    queryKey: ["admin-users", page, roleFilter, search, sortParam],
    queryFn: () =>
      adminService.getUsers(
        page,
        20,
        roleFilter || undefined,
        search || undefined,
        sortParam,
      ),
  });
  const data = usersQuery.data;
  const { data: riskCases } = useQuery({
    queryKey: ["admin-risk-cases-summary"],
    queryFn: adminService.getRiskCases,
  });
  const customerRisk = useMemo(() => {
    const map = new Map<number, "HIGH" | "MEDIUM" | "LOW">();
    riskCases
      ?.filter(
        (item) => item.status === "OPEN" && item.referenceType === "CUSTOMER",
      )
      .forEach((item) => {
        const current = map.get(item.referenceId);
        if (
          !current ||
          (current === "LOW" && item.severity !== "LOW") ||
          (current === "MEDIUM" && item.severity === "HIGH")
        )
          map.set(item.referenceId, item.severity);
      });
    return map;
  }, [riskCases]);
  const visibleUsers = data?.content || [];
  const resetFilters = () => {
    setRoleFilter("");
    setSearchInput("");
    setSearch("");
    setSort("name");
    setPage(0);
  };

  return (
    <div className="mf-page">
      <PageHeader
        eyebrow="Erişim yönetimi"
        title="Kullanıcılar"
        description="Müşteri, satıcı ve yönetici hesaplarını rol ve durum bilgileriyle yönetin."
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(searchInput.trim());
          setPage(0);
        }}
        className="mf-surface flex flex-wrap items-center gap-2 p-3"
      >
        {["", "CUSTOMER", "SELLER", "ADMIN"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRoleFilter(r);
              setPage(0);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === r
                ? "bg-primary-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {r === "" ? "Tümü" : roleLabels[r]}
          </button>
        ))}
        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Ad, e-posta veya telefon ara"
          className="mf-input min-w-56 flex-1"
          aria-label="Kullanıcı ara"
        />
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as typeof sort);
            setPage(0);
          }}
          className="mf-input w-auto"
          aria-label="Kullanıcı sıralaması"
        >
          <option value="name">Ada göre sırala</option>
          <option value="role">Role göre sırala</option>
          <option value="status">Duruma göre sırala</option>
        </select>
        <details className="relative">
          <summary className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
            Sütunlar
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-3 shadow-floating">
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(event) => setShowEmail(event.target.checked)}
              />
              E-posta
            </label>
            <label className="mt-2 flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(event) => setShowPhone(event.target.checked)}
              />
              Telefon
            </label>
          </div>
        </details>
        <Button type="submit" size="sm">
          Ara
        </Button>
        {(roleFilter || search || sort !== "name") && (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            Filtreleri temizle
          </Button>
        )}
      </form>

      {data && (
        <p className="text-xs font-semibold text-slate-500">
          {data.totalElements} kullanıcı bulundu
          {data.totalPages > 1 ? ` · ${data.number + 1}. sayfa` : ""}
        </p>
      )}

      <QueryBoundary
        query={usersQuery}
        loadingLabel="Kullanıcılar yükleniyor…"
        errorTitle="Kullanıcılar yüklenemedi"
        isEmpty={(result) => result.content.length === 0}
        emptyTitle="Kullanıcı bulunamadı"
        emptyDescription="Arama veya rol filtresini değiştirerek tekrar deneyin."
        emptyAction={
          roleFilter || search ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Filtreleri temizle
            </Button>
          ) : undefined
        }
      >
        {() => (
        <>
          <div className="mf-surface overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Ad Soyad
                  </th>
                  {showEmail && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      E-posta
                    </th>
                  )}
                  {showPhone && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Telefon
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-primary-50/40"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500">
                      #{user.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {user.firstName} {user.lastName}
                    </td>
                    {showEmail && (
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.email}
                      </td>
                    )}
                    {showPhone && (
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.phone || "-"}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <StatusBadge
                        tone={
                          user.role === "ADMIN"
                            ? "danger"
                            : user.role === "SELLER"
                              ? "info"
                              : "success"
                        }
                      >
                        {roleLabels[user.role] || user.role}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={user.active ? "success" : "danger"}>
                        {user.active ? "Aktif" : "Pasif"}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      {customerRisk.has(user.id) ? (
                        <StatusBadge
                          tone={
                            customerRisk.get(user.id) === "HIGH"
                              ? "danger"
                              : customerRisk.get(user.id) === "MEDIUM"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {customerRisk.get(user.id) === "HIGH"
                            ? "Yüksek risk"
                            : customerRisk.get(user.id) === "MEDIUM"
                              ? "Orta risk"
                              : "İzlemede"}
                        </StatusBadge>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="text-sm text-danger-600 hover:text-danger-800 font-medium"
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.first}
              >
                Önceki
              </Button>
              <label className="text-sm text-slate-600">
                Sayfa
                <select aria-label="Kullanıcı sayfası" value={data.number} onChange={(event) => setPage(Number(event.target.value))} className="mf-input ml-2 w-auto py-1.5">
                  {Array.from({ length: data.totalPages }, (_, index) => <option key={index} value={index}>{index + 1}</option>)}
                </select>
                <span className="ml-2">/ {data.totalPages}</span>
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
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
