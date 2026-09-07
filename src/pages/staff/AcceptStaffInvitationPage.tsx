import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, UserRoundCheck } from "lucide-react";
import { sellerService } from "@/services/sellerService";
import MealFlexLogo from "@/components/brand/MealFlexLogo";

export default function AcceptStaffInvitationPage() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") || "";
  const [token, setToken] = useState(initialToken);
  const accept = useMutation({
    mutationFn: () => sellerService.acceptStoreStaffInvitation(token.trim()),
  });

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <MealFlexLogo />
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <UserRoundCheck aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-slate-950">Personel davetini kabul et</h1>
        <p className="mt-2 text-sm text-slate-600">
          Davetin gönderildiği e-posta adresiyle giriş yapmış olmalısınız. Kabulden sonra yalnız size verilen mağaza yetkileri açılır.
        </p>

        {accept.isSuccess ? (
          <div className="mt-6 rounded-2xl bg-success-50 p-4 text-success-900" role="status">
            <p className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5" />Davet kabul edildi</p>
            <p className="mt-1 text-sm">Rolünüz: {accept.data.role}</p>
            {accept.data.role === "COURIER" && (
              <Link className="mt-4 inline-flex rounded-xl bg-success-700 px-4 py-2 text-sm font-bold text-white" to="/courier">
                Kurye çalışma alanına git
              </Link>
            )}
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              accept.mutate();
            }}
          >
            <label className="block text-sm font-bold" htmlFor="invitation-token">Davet kodu</label>
            <input
              id="invitation-token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
              className="h-12 w-full rounded-xl border border-slate-300 px-3"
              placeholder="Davet bağlantısındaki kod"
            />
            {accept.isError && (
              <p className="rounded-xl bg-danger-50 p-3 text-sm text-danger-700" role="alert">
                Davet kabul edilemedi. Doğru hesapla giriş yaptığınızı ve bağlantının süresinin dolmadığını kontrol edin.
              </p>
            )}
            <button disabled={!token.trim() || accept.isPending} className="h-12 w-full rounded-xl bg-primary-600 font-bold text-white disabled:opacity-50">
              {accept.isPending ? "Kabul ediliyor…" : "Daveti kabul et"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
