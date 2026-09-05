import { useQuery } from "@tanstack/react-query";
import { Navigate, Link } from "react-router-dom";
import { Plus, Store } from "lucide-react";
import { sellerService } from "@/services/sellerService";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function SellerDashboardEntryPage() {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ["seller-profile-exists", user?.userId],
    queryFn: sellerService.profileExists,
  });
  const stores = useQuery({
    queryKey: ["seller-stores", user?.userId],
    queryFn: sellerService.getMyStores,
    enabled: profile.data !== false,
  });

  if (profile.isLoading || stores.isLoading) {
    return (
      <div className="py-16 text-center text-sm font-semibold text-slate-500">
        Mağaza Dashboard’u hazırlanıyor…
      </div>
    );
  }

  if (profile.data === false) {
    return (
      <div className="mf-page">
        <PageHeader
          eyebrow="Satıcı hesabı"
          title="Operasyona başlamaya hazırsınız"
          description="Mağaza açabilmek için önce satıcı profilinizi tamamlayın."
        />
        <EmptyState
          title="Satıcı profiliniz henüz tamamlanmadı"
          description="Profilinizi tamamladıktan sonra mağaza açabilir ve abonelik talepleri alabilirsiniz."
          icon={<Store className="h-6 w-6" />}
          action={
            <Link to="/seller/profile">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Profili tamamla
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const firstStore = stores.data?.[0];
  if (firstStore) {
    return (
      <Navigate
        replace
        to={`/seller/stores/${firstStore.id}/dashboard`}
      />
    );
  }

  return (
    <div className="mf-page">
      <PageHeader
        eyebrow="Mağaza operasyonu"
        title="Dashboard için bir mağaza oluşturun"
        description="Dashboard verileri mağaza bazında gösterilir."
      />
      <EmptyState
        title="Henüz mağazanız yok"
        description="İlk mağazanızı oluşturduğunuzda operasyon Dashboard’unuz hazır olacak."
        icon={<Store className="h-6 w-6" />}
        action={
          <Link to="/seller/stores">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Mağaza oluştur
            </Button>
          </Link>
        }
      />
    </div>
  );
}
