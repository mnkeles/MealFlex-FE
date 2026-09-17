import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircleHelp,
  CreditCard,
  MapPinned,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { subscriptionService } from "@/services/subscriptionService";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { complaintResolutionLabel } from "@/constants/complaintResolutions";
import SupportContactForm from "@/components/support/SupportContactForm";

const faqs = [
  {
    category: "Abonelik",
    question: "Abonelik talebim ne zaman başlar?",
    answer:
      "Talebiniz önce satıcının onayına gönderilir. Satıcının talebi en geç bir hafta içinde yanıtlaması gerekir; onaylanana kadar durumunuz Onay bekliyor olarak görünür.",
  },
  {
    category: "Abonelik",
    question: "Çalışılmayan günler toplam ücrete dahil edilir mi?",
    answer:
      "Hayır. Mağazanın kapalı olduğu veya hizmet vermediği günler teslimat takviminden ve ücret hesabından çıkarılır.",
  },
  {
    category: "Ödeme",
    question: "Haftalık ücret ne zaman tahsil edilir?",
    answer:
      "Her takvim haftasında, o haftaki ilk yemek teslimatınızın yapılacağı gün saat 09:00'da haftalık ücret kayıtlı ödeme aracınızdan tahsil edilir.",
  },
  {
    category: "Ödeme",
    question: "Ödeme yöntemini kim seçer?",
    answer:
      "Ödeme yöntemini müşteri seçer. Abonelik talebini tamamlamadan önce kayıtlı ödeme araçlarınızdan birini seçmeniz gerekir.",
  },
  {
    category: "Ödeme",
    question: "Hangi hafta ne kadar ödeme yapılacağını nerede görürüm?",
    answer:
      "Abonelik oluştururken ödeme ve onay adımındaki haftalık tahsilat takvimini açarak her tahsilat gününü ve tutarını görebilirsiniz.",
  },
  {
    category: "Teslimat",
    question: "Teslimatla ilgili sorunumu nasıl bildiririm?",
    answer:
      "Aboneliklerim ekranından ilgili aboneliği açın, teslimatı seçin ve Destek ve işlemler bölümünden sorun bildirin. Oluşturduğunuz talebi bu sayfadan takip edebilirsiniz.",
  },
  {
    category: "Teslimat",
    question: "Teslimat adresimi nereden yönetebilirim?",
    answer:
      "Adreslerim ekranından iş yeri veya diğer teslimat adreslerinizi ekleyebilir ve varsayılan adresinizi değiştirebilirsiniz.",
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
      "Hesap ve Güvenlik ekranından ilgili oturumu kapatın. Ardından Profil ekranından şifrenizi değiştirin ve iletişim bilgilerinizin doğrulama durumunu kontrol edin.",
  },
];

const quickLinks = [
  {
    title: "Aboneliklerim",
    description: "Planlarınızı, teslimatları ve durumlarını görüntüleyin.",
    to: "/subscriptions",
    icon: TicketCheck,
  },
  {
    title: "Ödeme işlemleri",
    description: "Ödeme geçmişinizi ve kayıtlı kartlarınızı yönetin.",
    to: "/payments",
    icon: CreditCard,
  },
  {
    title: "Adreslerim",
    description: "Teslimat adreslerinizi ekleyin veya güncelleyin.",
    to: "/addresses",
    icon: MapPinned,
  },
  {
    title: "Hesap güvenliği",
    description: "Oturumları ve bildirim tercihlerini yönetin.",
    to: "/security",
    icon: ShieldCheck,
  },
];

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tümü");
  const { data, isLoading } = useQuery({
    queryKey: ["customer-complaints"],
    queryFn: () => subscriptionService.getComplaints(),
  });
  const upload = useMutation({
    mutationFn: ({ complaintId, file }: { complaintId: number; file: File }) =>
      subscriptionService.uploadComplaintAttachment(complaintId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customer-complaints"] }),
  });
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

  return (
    <div className="mf-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Yardım ve talepler"
        title="Destek Merkezi"
        description="Sorularınıza yanıt bulun, ilgili işlemlere ulaşın ve oluşturduğunuz destek taleplerini takip edin."
      />

      <SupportContactForm />

      <section>
        <h2 className="text-lg font-semibold text-ink">Hızlı işlemler</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sık kullanılan müşteri ekranlarına doğrudan ulaşın.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ icon: Icon, ...item }) => (
            <Link
              key={item.title}
              to={item.to}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card transition hover:border-primary-200 hover:shadow-lg"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
                {item.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
                Ekranı aç
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <CircleHelp className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink">Sık sorulan sorular</h2>
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
        <label className="mt-4 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-slate-600">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Destek içeriğinde ara</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Sık sorulan sorularda ara" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </label>
        {filteredFaqs.length ? (
          <div className="mt-4 divide-y divide-slate-100">
            {filteredFaqs.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="cursor-pointer list-none pr-8 text-sm font-semibold text-slate-800 marker:hidden">
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
      </section>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Destek taleplerim</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Yeni sorun bildirmek için Aboneliklerim sayfasından ilgili teslimatı
              açın ve Destek ve işlemler bölümünü kullanın.
            </p>
          </div>
          <Link
            to="/subscriptions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
          >
            Aboneliklerime git <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-5 h-40 animate-pulse rounded-xl bg-slate-200" />
        ) : !data?.content.length ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-10 text-center shadow-card">
            <MessageSquareWarning className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold">Destek talebiniz bulunmuyor.</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Teslimatla ilgili bir problem yaşarsanız ilgili abonelik detayından
              sorun bildirebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {data.content.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      Talep #{item.id} · {item.reason}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.storeName} ·{" "}
                      {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <StatusBadge domain="complaint" status={item.status} />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="text-xs font-bold text-slate-700">
                    Durum zaman çizelgesi
                  </p>
                  <p className="mt-1 text-slate-600">
                    ✓ Talep oluşturuldu ·{" "}
                    {new Date(item.createdAt).toLocaleString("tr-TR")}
                  </p>
                  {item.sellerResponse && (
                    <p className="mt-1 text-slate-600">
                      ✓ Satıcı yanıt verdi ·{" "}
                      {item.updatedAt &&
                        new Date(item.updatedAt).toLocaleString("tr-TR")}
                    </p>
                  )}
                  {item.resolvedAt && (
                    <p className="mt-1 text-success-700">
                      ✓ Destek kararı uygulandı ·{" "}
                      {new Date(item.resolvedAt).toLocaleString("tr-TR")}
                    </p>
                  )}
                </div>
                {item.sellerResponse && (
                  <div className="mt-3 rounded-xl bg-info-50 p-4">
                    <p className="text-xs font-bold text-info-800">Satıcı yanıtı</p>
                    <p className="mt-1 text-sm text-info-900">
                      {item.sellerResponse}
                    </p>
                  </div>
                )}
                {item.response && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-700">
                      Destek yanıtı
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{item.response}</p>
                  </div>
                )}
                {item.resolutionType && (
                  <div className="mt-3 rounded-xl border border-success-200 bg-success-50 p-4 text-sm text-success-900">
                    <p className="font-bold">
                      Çözüm uygulandı:{" "}
                      {complaintResolutionLabel(item.resolutionType)}
                    </p>
                    {item.resolutionAmount != null &&
                      item.resolutionAmount > 0 && (
                        <p>
                          Tutar:{" "}
                          {item.resolutionAmount.toLocaleString("tr-TR")} ₺
                        </p>
                      )}
                    {item.compensationCode && (
                      <p>
                        Telafi kodu: <strong>{item.compensationCode}</strong>
                      </p>
                    )}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    Kanıt ekle
                    <input
                      className="hidden"
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) upload.mutate({ complaintId: item.id, file });
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <span className="text-xs text-slate-500">
                    JPEG, PNG veya PDF · en fazla 10 MB
                  </span>
                </div>
                {upload.isError && (
                  <p className="mt-2 text-xs font-semibold text-danger-600">
                    Dosya yüklenemedi.
                  </p>
                )}
                <Link
                  to={`/subscriptions/${item.subscriptionId}`}
                  className="mt-4 inline-flex text-xs font-bold text-primary-600"
                >
                  İlgili aboneliği görüntüle →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
