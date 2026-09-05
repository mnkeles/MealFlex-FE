import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import AccountSecurityPanel from "@/components/customer/AccountSecurityPanel";
import PageHeader from "@/components/ui/PageHeader";

interface AccountProfile {
  emailVerified: boolean;
  phoneVerified: boolean;
  phone?: string;
}

export default function AccountSecurityPage() {
  const location = useLocation();
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: async () =>
      (await api.get<AccountProfile>("/v1/users/me")).data,
  });

  useEffect(() => {
    if (!location.hash) return;
    const section = document.getElementById(location.hash.slice(1));
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash, profile]);

  if (isLoading)
    return (
      <div className="py-16 text-center text-sm font-semibold text-slate-500" role="status">
        Hesap ve güvenlik bilgileri yükleniyor…
      </div>
    );
  if (isError || !profile)
    return (
      <div className="rounded-2xl border border-danger-100 bg-danger-50 p-5 text-sm font-semibold text-danger-700">
        Hesap ve güvenlik bilgileri yüklenemedi. Lütfen tekrar deneyin.
      </div>
    );
  return (
    <div className="mf-page mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Hesabım"
        title="Hesap ve Güvenlik"
        description="Doğrulamalarınızı, açık oturumlarınızı, bildirim tercihlerinizi ve kişisel verilerinizi tek yerden yönetin."
      />
      <AccountSecurityPanel profile={profile} />
    </div>
  );
}
