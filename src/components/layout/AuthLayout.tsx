import type { ReactNode } from "react";
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Leaf,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import MealFlexLogo from "@/components/brand/MealFlexLogo";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  variant?: "default" | "login" | "seller-login";
};

export default function AuthLayout({
  title,
  description,
  children,
  variant = "default",
}: AuthLayoutProps) {
  if (variant === "seller-login") {
    return (
      <main className="min-h-screen bg-[#f7f5f1] lg:grid lg:grid-cols-[minmax(34rem,1.06fr)_minmax(28rem,.94fr)]">
        <aside className="relative hidden min-h-screen overflow-hidden bg-[#0d1d2c] text-white lg:flex lg:flex-col lg:justify-between">
          <img
            src="/images/customer-access-modal-v2.jpg"
            alt="Catering mutfağında hazırlanmış kurumsal öğün"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#091827]/80 via-[#091827]/35 to-[#091827]/95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#091827]/40 via-transparent to-[#091827]/20" />

          <header className="relative z-10 flex items-center justify-between px-8 py-8 xl:px-12 xl:py-10">
            <MealFlexLogo
              surface="dark"
              iconClassName="h-11 w-11"
              wordmarkClassName="text-2xl font-black tracking-tight text-white"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/30 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md">
              <Store className="h-4 w-4 text-primary-300" />
              Satıcı merkezi
            </span>
          </header>

          <div className="relative z-10 px-8 pb-8 xl:px-12 xl:pb-10">
            <p className="text-xs font-black uppercase tracking-[.18em] text-primary-300">
              Günlük operasyon
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight xl:text-5xl">
              Mutfaktan teslimata, bütün gün tek ekranda.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 xl:text-lg">
              Bekleyen talepleri görün, hazırlanacak porsiyonu planlayın ve
              teslimatları mağazanıza ait güncel verilerle yönetin.
            </p>

            <div className="mt-9 grid max-w-2xl border-y border-white/20 sm:grid-cols-2">
              <div className="flex gap-3 py-5 sm:pr-6">
                <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-primary-300" />
                <div>
                  <p className="text-sm font-black">Talepler zamanında önünüzde</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">
                    Abonelik ve değişiklik kararlarını tek kuyruktan yönetin.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 border-t border-white/20 py-5 sm:border-l sm:border-t-0 sm:pl-6">
                <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-300" />
                <div>
                  <p className="text-sm font-black">Üretim ve teslimat birlikte</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">
                    Günün porsiyonunu ve teslimat durumlarını aynı yerde izleyin.
                  </p>
                </div>
              </div>
            </div>

            <footer className="mt-6 flex items-center justify-between text-xs text-white/60">
              <span>MealFlex Satıcı Operasyon Merkezi</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Güvenli giriş
              </span>
            </footer>
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-20">
          <div className="relative w-full max-w-md">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <MealFlexLogo
                iconClassName="h-10 w-10"
                wordmarkClassName="text-2xl font-black tracking-tight text-primary-600"
              />
              <span className="rounded-full bg-[#0d1d2c] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                Satıcı Merkezi
              </span>
            </div>

            <div className="relative mb-7 h-40 overflow-hidden rounded-3xl shadow-card lg:hidden">
              <img
                src="/images/customer-access-modal-v2.jpg"
                alt="Catering mutfağında hazırlanmış kurumsal öğün"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#091827]/90 via-[#091827]/25 to-transparent" />
              <p className="absolute bottom-4 left-5 right-5 text-lg font-black leading-tight text-white">
                Mutfaktan teslimata, bütün gün tek ekranda.
              </p>
            </div>

            <header>
              <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </header>

            <div className="mt-7 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,.09)] sm:p-7">
              {children}
            </div>
            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Satıcı hesabınıza güvenli bağlantı üzerinden erişiyorsunuz.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (variant === "login") {
    return (
      <main className="min-h-screen bg-[#f6f4ef] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,0.92fr)]">
        <aside className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col lg:justify-between">
          <img
            src="/images/login-meal-hero.jpg"
            alt="Dengeli bir öğle yemeği sofrası"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/10 to-slate-950/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/15 to-transparent" />

          <div className="relative z-10 p-8 xl:p-10">
            <div className="inline-flex rounded-2xl border border-white/20 bg-slate-950/25 px-4 py-3 shadow-lg backdrop-blur-md">
              <MealFlexLogo
                surface="dark"
                iconClassName="h-10 w-10"
                wordmarkClassName="text-2xl font-black tracking-tight text-white"
              />
            </div>
          </div>

          <div className="relative z-10 m-6 max-w-2xl rounded-3xl bg-slate-950/90 p-8 text-white shadow-2xl xl:m-8 xl:p-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-bold">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Her gün taze, her hafta planlı
            </div>
            <h2 className="max-w-xl text-4xl font-black leading-[1.08] tracking-tight xl:text-5xl">
              İş yerinde iyi yemek, iyi bir günün başlangıcı.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/85 xl:text-lg">
              Güvenilir yerel mutfaklardan dengeli menüler bulun; ekibinizin
              teslimat ve abonelik planını tek yerden yönetin.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2">
                <Leaf className="h-4 w-4 text-emerald-300" /> Dengeli menüler
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2">
                <Clock3 className="h-4 w-4 text-amber-300" /> Planlı teslimat
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-sky-300" /> Güvenli ödeme
              </span>
            </div>
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 lg:px-10 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <MealFlexLogo
                iconClassName="h-10 w-10"
                wordmarkClassName="text-2xl font-black tracking-tight text-primary-600"
              />
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
                Güvenli giriş
              </span>
            </div>

            <div className="relative mb-7 h-40 overflow-hidden rounded-3xl shadow-card lg:hidden">
              <img
                src="/images/login-meal-hero.jpg"
                alt="Dengeli bir öğle yemeği sofrası"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
              <p className="absolute bottom-4 left-5 right-5 text-lg font-black leading-tight text-white">
                Her gün taze, her hafta planlı.
              </p>
            </div>

            <header>
              <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </header>

            <div className="mt-7 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(31,41,55,0.10)] backdrop-blur sm:p-7">
              {children}
            </div>
            <p className="mt-6 text-center text-xs leading-5 text-slate-600">
              Devam ederek güvenli oturum ve veri işleme koşullarını kabul
              etmiş olursunuz.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream lg:grid lg:grid-cols-[minmax(20rem,0.9fr)_minmax(26rem,1.1fr)]">
      <aside className="hidden bg-primary-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <MealFlexLogo
          surface="dark"
          iconClassName="h-11 w-11"
          wordmarkClassName="text-2xl font-black tracking-tight text-white"
        />
        <div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
            <UtensilsCrossed className="h-7 w-7" />
          </div>
          <h1 className="mt-6 max-w-md text-4xl font-black tracking-tight">
            İş yeriniz için dengeli yemek, düzenli teslimat.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-white/80">
            Menünüzü seçin, teslimatınızı planlayın, aboneliğinizi tek yerden
            yönetin.
          </p>
          <ul className="mt-8 space-y-3 text-sm font-semibold text-white/90">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent-100" />
              Esnek abonelik yönetimi
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent-100" />
              Güvenli ödeme akışı
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent-100" />
              Yerel işletmelerden seçenekler
            </li>
          </ul>
        </div>
        <p className="text-xs text-white/65">© MealFlex</p>
      </aside>
      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-7 lg:hidden">
            <MealFlexLogo
              iconClassName="h-11 w-11"
              wordmarkClassName="text-2xl font-black tracking-tight text-primary-600"
            />
          </div>
          <header>
            <p className="text-xs font-black uppercase tracking-[.14em] text-primary-700">
              MealFlex hesabı
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </header>
          <div className="mt-7 rounded-mf-surface border border-slate-200 bg-white p-5 shadow-card sm:p-7">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
