import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UsersRound,
  UtensilsCrossed,
  WalletCards,
  X,
} from "lucide-react";
import MealFlexLogo from "@/components/brand/MealFlexLogo";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";

type AccessMode = "login" | "register";

function AccessModal({
  mode,
  onModeChange,
  onClose,
}: {
  mode: AccessMode;
  onModeChange: (mode: AccessMode) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button, input, a")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-access-title"
        className="relative grid max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_36px_120px_rgba(2,6,23,.45)] lg:grid-cols-[.82fr_1.18fr]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition hover:bg-slate-100 hover:text-slate-950"
          aria-label="Pencereyi kapat"
        >
          <X className="h-5 w-5" />
        </button>

        <aside className="relative hidden overflow-hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <img
            src="/images/customer-access-modal-v2.jpg"
            alt="Profesyonel catering sunumunda dengeli bir öğün"
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/45 to-slate-950" />
          <MealFlexLogo
            surface="dark"
            className="relative z-10"
            iconClassName="h-10 w-10"
            wordmarkClassName="text-2xl font-black tracking-tight text-white"
          />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" /> Her hafta planlı
            </span>
            <h2 className="mt-5 text-3xl font-black leading-tight">
              İş yeriniz için iyi yemek, tek abonelik.
            </h2>
            <ul className="mt-6 space-y-3 text-sm font-semibold text-white/90">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Bölgenize uygun mutfaklar
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Planlı ve düzenli teslimat
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Haftalık güvenli ödeme
              </li>
            </ul>
          </div>
        </aside>

        <div className="max-h-[94vh] overflow-y-auto px-5 py-7 sm:px-9 sm:py-9 lg:px-12">
          <div className="pr-12">
            <p className="text-xs font-black uppercase tracking-[.16em] text-primary-600">
              MealFlex hesabı
            </p>
            <h2 id="customer-access-title" className="mt-2 text-3xl font-black tracking-tight text-ink">
              {mode === "login" ? "Tekrar hoş geldiniz" : "MealFlex’e katılın"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {mode === "login"
                ? "Abonelik ve teslimatlarınıza kaldığınız yerden devam edin."
                : "İş yeriniz için uygun menüleri keşfetmek üzere hesabınızı oluşturun."}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Hesap işlemi">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => onModeChange("login")}
              className={`rounded-lg px-4 py-2.5 text-sm font-black transition ${mode === "login" ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => onModeChange("register")}
              className={`rounded-lg px-4 py-2.5 text-sm font-black transition ${mode === "register" ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Üye Ol
            </button>
          </div>

          <div className="mt-6">
            {mode === "login" ? (
              <LoginPage audience="CUSTOMER" embedded onSwitchToRegister={() => onModeChange("register")} />
            ) : (
              <RegisterPage embedded onSwitchToLogin={() => onModeChange("login")} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CustomerAccessPage() {
  const [accessMode, setAccessMode] = useState<AccessMode | null>(null);

  const openAccess = (mode: AccessMode) => setAccessMode(mode);
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${sectionId}`);
    window.setTimeout(
      () =>
        section
          .querySelector<HTMLElement>("[data-section-heading]")
          ?.focus({ preventScroll: true }),
      450,
    );
  };

  return (
    <main className="min-h-screen bg-[#fffdfa] text-ink">
      <header className="sticky top-0 z-40 bg-[#091827]/92 px-3 py-3 backdrop-blur-xl sm:px-5">
        <div className="mx-auto max-w-7xl">
        <div className="relative flex h-16 items-center gap-3 rounded-2xl border border-white/10 bg-[#13283a]/95 px-3 shadow-[0_14px_34px_rgba(2,6,23,.28)] sm:px-4 lg:px-5">
          <MealFlexLogo
            surface="dark"
            iconClassName="h-10 w-10"
            wordmarkClassName="text-xl font-black tracking-tight text-white sm:text-2xl"
          />
          <p className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap text-sm font-bold text-slate-200 xl:flex">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.08] text-primary-300">
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
            </span>
            İş yerinize uygun haftalık öğün planını keşfedin.
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAccess("login")}
              className="h-10 rounded-xl border border-white/20 bg-white/[0.06] px-4 text-sm font-black text-white transition hover:border-white/40 hover:bg-white/[0.12]"
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => openAccess("register")}
              className="h-10 rounded-xl bg-primary-600 px-4 text-sm font-black text-white shadow-[0_8px_22px_rgba(220,54,38,.22)] transition hover:-translate-y-0.5 hover:bg-primary-700"
            >
              Üye Ol
            </button>
          </div>
        </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary-100/70 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_.92fr] lg:px-8 lg:py-20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-black text-primary-700 ring-1 ring-primary-100">
              <UtensilsCrossed className="h-4 w-4" /> İş yerinize gelen iyi yemek
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Ekibiniz için doğru öğünü kolayca bulun.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Bölgenizdeki güvenilir catering firmalarını keşfedin, haftalık
              menüyü seçin ve iş yeri yemeklerinizi tek abonelikle planlayın.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => openAccess("register")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(220,54,38,.24)] transition hover:-translate-y-0.5 hover:bg-primary-700"
              >
                Ücretsiz üye ol <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#restaurants"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection("restaurants");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-black text-slate-800 transition hover:border-primary-300 hover:text-primary-700"
              >
                <Search className="h-4 w-4" /> Menüleri incele
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-600" /> Bölgenize özel seçenekler</span>
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary-600" /> Haftalık plan</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary-600" /> Güvenli ödeme</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-warning-200/60 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-[0_32px_80px_rgba(15,23,42,.24)]">
              <img
                src="/images/login-meal-hero.jpg"
                alt="İş yeri için hazırlanmış dengeli öğün"
                className="h-[26rem] w-full object-cover sm:h-[32rem]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/20 bg-slate-950/70 p-5 text-white backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-amber-300">Bu haftanın menüsü</p>
                <p className="mt-2 text-xl font-black">Çorba · Ana yemek · Yardımcı · Salata</p>
                <p className="mt-2 text-sm text-white/75">Her gün “ne yesek?” demeden iyi yemek.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="restaurants"
        className="scroll-mt-36 border-b border-slate-200 bg-white md:scroll-mt-28"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-primary-600">
              Bölgenizdeki catering firmaları
            </p>
            <h2
              data-section-heading
              tabIndex={-1}
              className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight outline-none sm:text-4xl"
            >
              Öğle yemeğini her gün yeniden düşünmeyin.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Adresinize servis yapan mutfakları karşılaştırın. Menüyü, kişi
              sayısını ve teslimat saatini ekibinizin düzenine göre belirleyin.
            </p>

            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              <div className="flex gap-4 py-5">
                <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                <div>
                  <h3 className="font-black text-slate-900">
                    Ekibinize uygun seçenekler
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Minimum kişi sayısı, servis bölgesi ve menü içeriği en
                    baştan görünür.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 py-5">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                <div>
                  <h3 className="font-black text-slate-900">
                    Haftalık plan, gerektiğinde değişiklik
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Teslimat günlerinizi planlayın; uygun süre içinde saat ve
                    kişi değişikliği talep edin.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openAccess("register")}
              className="mt-8 inline-flex items-center gap-2 text-sm font-black text-primary-700 transition hover:gap-3 hover:text-primary-800"
            >
              Bölgenizdeki mutfakları görün
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] bg-slate-100">
              <img
                src="/images/customer-access-modal-v2.jpg"
                alt="Catering firması tarafından hazırlanmış dengeli öğün"
                className="h-[22rem] w-full object-cover sm:h-[30rem]"
              />
            </div>
            <div className="relative mx-4 -mt-16 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,.16)] backdrop-blur sm:mx-8 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[.14em] text-primary-600">
                  Tek ekrandan
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  Menü, teslimat ve ödeme planı
                </p>
              </div>
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600 sm:mt-0">
                Ne zaman, kaç kişiye ve hangi mutfaktan geleceğini önceden
                bilin.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="scroll-mt-36 bg-[#0d1d2c] text-white md:scroll-mt-24"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-primary-300">
                Nasıl çalışır?
              </p>
              <h2
                id="how-it-works-heading"
                data-section-heading
                tabIndex={-1}
                className="mt-3 max-w-lg text-3xl font-black leading-tight tracking-tight outline-none sm:text-4xl"
              >
                İlk teslimata kadar üç net adım.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base lg:justify-self-end">
              Uzun formlar veya belirsiz teklifler yok. Adresinizi seçin,
              uygun mutfağı bulun ve haftalık planınızı oluşturun.
            </p>
          </div>

          <ol className="mt-12 grid border-y border-white/15 md:grid-cols-3">
            <li className="py-7 md:pr-8">
              <div className="flex items-center justify-between">
                <MapPin className="h-6 w-6 text-primary-300" />
                <span className="text-xs font-black tracking-[.18em] text-slate-500">
                  01
                </span>
              </div>
              <h3 className="mt-8 text-xl font-black">Adresinizi seçin</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Yalnızca iş yerinize gerçekten servis yapabilen catering
                firmalarını görün.
              </p>
            </li>
            <li className="border-t border-white/15 py-7 md:border-l md:border-t-0 md:px-8">
              <div className="flex items-center justify-between">
                <WalletCards className="h-6 w-6 text-primary-300" />
                <span className="text-xs font-black tracking-[.18em] text-slate-500">
                  02
                </span>
              </div>
              <h3 className="mt-8 text-xl font-black">Planınızı oluşturun</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Menüyü, günleri, teslimat saatini ve kişi sayısını belirleyip
                abonelik talebinizi gönderin.
              </p>
            </li>
            <li className="border-t border-white/15 py-7 md:border-l md:border-t-0 md:pl-8">
              <div className="flex items-center justify-between">
                <Truck className="h-6 w-6 text-primary-300" />
                <span className="text-xs font-black tracking-[.18em] text-slate-500">
                  03
                </span>
              </div>
              <h3 className="mt-8 text-xl font-black">Teslim almaya başlayın</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Satıcı onayından sonra teslimatlarınızı ve haftalık
                ödemelerinizi hesabınızdan takip edin.
              </p>
            </li>
          </ol>

          <div className="mt-12 flex flex-col gap-5 rounded-2xl bg-white/[.06] px-6 py-6 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-lg font-black">İş yeriniz için ilk planı oluşturun.</p>
              <p className="mt-1 text-sm text-slate-300">
                Üyelikten sonra adresinize uygun seçenekler gösterilir.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAccess("register")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white transition hover:bg-primary-500"
            >
              Ücretsiz üye ol
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {accessMode && (
        <AccessModal
          mode={accessMode}
          onModeChange={setAccessMode}
          onClose={() => setAccessMode(null)}
        />
      )}
    </main>
  );
}
