import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  CircleHelp,
  ClipboardCheck,
  LifeBuoy,
  Search,
  ShieldCheck,
  Store,
  Truck,
  WalletCards,
} from "lucide-react";
import { sellerService } from "@/services/sellerService";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

const faqs = [
  {
    category: "Mağazalar",
    question: "Mağazamı nasıl yayına hazırlarım?",
    answer:
      "Mağaza vitrini, çalışma saatleri, teslimat alanı, menü, gerekli belgeler ve banka bilgileri tamamlanmalıdır. Eksik alanları mağazanızın Vitrin, Belgeler ve Ayarlar bölümlerinden kontrol edebilirsiniz.",
  },
  {
    category: "Abonelik talepleri",
    question: "Yeni abonelik talebini ne kadar sürede yanıtlamalıyım?",
    answer:
      "Talep oluşturulduktan sonra en geç bir hafta içinde karar vermelisiniz. Bekleyen talepler için talep anında ve her gün saat 13:00'te bildirim gönderilir.",
  },
  {
    category: "Abonelik talepleri",
    question: "Bir talebi kabul etmeden önce neleri kontrol etmeliyim?",
    answer:
      "Kişi sayısını, hizmet tarihlerini, teslimat saatini ve adresi kontrol edin. Ödeme yöntemini müşteri seçer; satıcının ayrıca bir ödeme yöntemi seçmesi gerekmez.",
  },
  {
    category: "Operasyon",
    question: "Günlük hazırlanacak porsiyonları nereden görürüm?",
    answer:
      "Mağazanızın Üretim veya Günlük Sipariş ekranı, seçilen gün için hazırlanması gereken toplam porsiyonları ve teslimat kayıtlarını gösterir.",
  },
  {
    category: "Operasyon",
    question: "Teslimatla ilgili bir sorun olduğunda ne yapmalıyım?",
    answer:
      "Önce Canlı Operasyon ekranından teslimat durumunu ve kurye kaydını kontrol edin. Müşteri bildirimi varsa Şikâyetler bölümünden yanıtlayın ve teslimat kaydını güncel tutun.",
  },
  {
    category: "Gelir",
    question: "Kazancım ne zaman hesabıma aktarılır?",
    answer:
      "Her takvim haftasında müşterinin son yemek teslimatı tamamlandıktan bir saat sonra, ilgili haftanın satıcı geliri ödeme planına alınır.",
  },
  {
    category: "Gelir",
    question: "Gelir ve iade hareketlerini nereden izlerim?",
    answer:
      "Mağazanızın Gelir ekranında tarih ve durum filtrelerini kullanarak abonelik bazlı gelir, iade ve ödeme durumlarını görüntüleyebilirsiniz.",
  },
  {
    category: "Hesap",
    question: "Bildirim kanallarını nasıl değiştiririm?",
    answer:
      "Hesap ve Güvenlik ekranındaki Bildirim kanalları bölümünden e-posta, SMS, uygulama ve pazarlama tercihlerinizi değiştirebilirsiniz.",
  },
  {
    category: "Hesap",
    question: "Tanımadığım bir oturum görürsem ne yapmalıyım?",
    answer:
      "Hesap ve Güvenlik ekranından ilgili oturumu hemen kapatın. Ardından şifrenizi yenileyin ve iletişim bilgilerinizin doğrulama durumunu kontrol edin.",
  },
];

export default function SellerSupportPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tümü");
  const { data: stores = [] } = useQuery({
    queryKey: ["seller-stores-switcher", user?.userId],
    queryFn: sellerService.getMyStores,
  });
  const firstStore = stores[0];
  const categories = ["Tümü", ...new Set(faqs.map((item) => item.category))];
  const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
  const filteredFaqs = useMemo(
    () =>
      faqs.filter(
        (item) =>
          (category === "Tümü" || item.category === category) &&
          (!normalizedSearch ||
            `${item.question} ${item.answer}`
              .toLocaleLowerCase("tr-TR")
              .includes(normalizedSearch)),
      ),
    [category, normalizedSearch],
  );

  const storePath = (section: string) =>
    firstStore ? `/seller/stores/${firstStore.id}/${section}` : "/seller/stores";
  const quickLinks = [
    {
      title: "Bekleyen talepler",
      description: "Yanıt bekleyen abonelik isteklerini inceleyin.",
      path: storePath("pending"),
      icon: ClipboardCheck,
    },
    {
      title: "Canlı operasyon",
      description: "Teslimat ve günlük sipariş durumlarını kontrol edin.",
      path: storePath("operations"),
      icon: Truck,
    },
    {
      title: "Gelir hareketleri",
      description: "Gelir, iade ve ödeme durumlarını görüntüleyin.",
      path: storePath("payouts"),
      icon: WalletCards,
    },
    {
      title: "Hesap güvenliği",
      description: "Oturumları ve bildirim tercihlerini yönetin.",
      path: "/seller/security",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="mf-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Yardım ve yönlendirme"
        title="Destek Merkezi"
        description="Aradığınız işlemi bulun, sık karşılaşılan soruların yanıtlarını okuyun veya ilgili ekrana doğrudan geçin."
      />

      <section className="rounded-2xl bg-slate-950 p-5 text-white shadow-card sm:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-primary-300">
            <LifeBuoy className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black">Size nasıl yardımcı olabiliriz?</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              İşlem adı, ekran veya hata mesajıyla arama yapabilirsiniz.
            </p>
            <label className="mt-4 flex h-12 items-center gap-3 rounded-xl bg-white px-4 text-slate-600 shadow-sm">
              <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="sr-only">Destek içeriğinde ara</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Örnek: ödeme ne zaman aktarılır?"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-ink">Hızlı işlemler</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sık kullanılan satıcı ekranlarına doğrudan ulaşın.
            </p>
          </div>
          {!firstStore && (
            <span className="text-xs font-semibold text-warning-700">
              Mağaza işlemleri için önce mağaza oluşturun.
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ icon: Icon, ...item }) => (
            <Link
              key={item.title}
              to={item.path}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-black text-ink">{item.title}</h3>
              <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
                {item.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-primary-600">
                Ekranı aç
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
              <CircleHelp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-ink">Sık sorulan sorular</h2>
              <p className="text-sm text-slate-500">
                {filteredFaqs.length} yardım içeriği gösteriliyor.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Yardım kategorileri">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${category === item ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-700"}`}
              >
                {item}
              </button>
            ))}
          </div>
          {filteredFaqs.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {filteredFaqs.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="cursor-pointer list-none pr-8 text-sm font-black text-slate-800 marker:hidden">
                    <span className="mr-2 text-primary-600">+</span>
                    {item.question}
                  </summary>
                  <p className="mt-3 pl-5 text-sm leading-6 text-slate-600">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Eşleşen yardım içeriği bulunamadı"
              description="Başka bir kelimeyle arayın veya Tümü kategorisini seçin."
              icon={<Search className="h-6 w-6" />}
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <Store className="h-5 w-5 text-primary-600" />
            <h2 className="mt-3 font-black text-ink">Mağaza ayarları</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Çalışma saatleri, teslimat bölgesi, personel ve belgeleri mağaza içinden yönetin.
            </p>
            <Link
              to={storePath("settings")}
              className="mt-4 inline-flex items-center gap-1 text-sm font-black text-primary-600"
            >
              Ayarlara git <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <Bell className="h-5 w-5 text-primary-600" />
            <h2 className="mt-3 font-black text-ink">İşlem uyarıları</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Talep, teslimat ve hesap uyarılarını Bildirimler ekranından takip edin.
            </p>
            <Link
              to="/seller/notifications"
              className="mt-4 inline-flex items-center gap-1 text-sm font-black text-primary-600"
            >
              Bildirimleri aç <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
