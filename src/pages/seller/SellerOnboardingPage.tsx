import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/ui/PageHeader";

export default function SellerOnboardingPage() {
  const { user } = useAuth();
  const {
    data: stores = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["seller-stores", user?.userId],
    queryFn: sellerService.getMyStores,
  });
  if (isLoading)
    return (
      <div className="py-12 text-center text-slate-500" role="status">
        Mağaza başvuruları yükleniyor…
      </div>
    );
  if (isError)
    return (
      <div className="rounded-xl bg-danger-50 p-5 text-danger-700">
        Başvuru bilgileri yüklenemedi. Lütfen tekrar deneyin.
      </div>
    );
  return (
    <div className="mf-page mx-auto max-w-4xl">
      <PageHeader
        eyebrow="İşletme yönetimi"
        title="Mağaza başvuruları"
        description="Her şube için sözleşme, zorunlu belgeler ve yayın uygunluğunu takip edin."
      />
      <div className="mt-6 grid gap-4">
        {stores.length ? (
          stores.map((store) => (
            <article
              key={store.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e7e7e7] bg-white p-5"
            >
              <div>
                <h2 className="font-bold">{store.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {store.city} / {store.district} ·{" "}
                  {store.status === "ACTIVE"
                    ? "Yayında"
                    : "Onboarding tamamlanmalı"}
                </p>
              </div>
              <Link
                to={`/seller/stores/${store.id}/documents`}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white"
              >
                Başvuruyu aç
              </Link>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-[#e7e7e7] bg-white p-8 text-center text-slate-500">
            Henüz mağaza şubeniz bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
