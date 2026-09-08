import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  Users,
} from "lucide-react";
import { storeService } from "@/services/storeService";
import {
  subscriptionService,
  type SubscriptionInput,
} from "@/services/subscriptionService";
import { useCustomerAddress } from "@/contexts/CustomerAddressContext";
import { parseApiError } from "@/utils/apiErrors";
import { paymentService } from "@/services/paymentService";
import MockCardTokenizationForm from "@/components/payment/MockCardTokenizationForm";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import PersonCountSelector from "@/components/subscription/PersonCountSelector";

const steps = [
  "Menü",
  "Kişi sayısı",
  "Tarih aralığı",
  "Teslimat",
  "Ödeme ve onay",
];
const tomorrowPlusTwo = () =>
  new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

const dayKeys = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const quickDurations = [
  { amount: 2, unit: "week", label: "2 hafta" },
  { amount: 4, unit: "week", label: "4 hafta" },
  { amount: 2, unit: "month", label: "2 ay" },
  { amount: 3, unit: "month", label: "3 ay" },
  { amount: 6, unit: "month", label: "6 ay" },
  { amount: 9, unit: "month", label: "9 ay" },
  { amount: 12, unit: "month", label: "12 ay" },
  { amount: 18, unit: "month", label: "18 ay" },
] as const;

function selectedDates(
  startDate: string,
  endDate: string,
  openDays?: ReadonlySet<string>,
) {
  if (!startDate || !endDate || endDate < startDate) return [];
  if (Date.parse(endDate) - Date.parse(startDate) >= 730 * 86400000) return [];
  const values: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  while (cursor <= end) {
    if (!openDays || openDays.has(dayKeys[cursor.getDay()])) {
      values.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return values;
}

function SelectedDeliveryCalendar({
  dates,
  startDate,
  endDate,
}: {
  dates: string[];
  startDate: string;
  endDate: string;
}) {
  const [visibleMonth, setVisibleMonth] = useState(startDate.slice(0, 7));

  useEffect(() => {
    setVisibleMonth(startDate.slice(0, 7));
  }, [startDate]);

  const selectedDateSet = new Set(dates);
  const monthStart = new Date(`${visibleMonth}-01T12:00:00`);
  const leadingEmptyDays = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate();
  const firstMonth = startDate.slice(0, 7);
  const lastMonth = endDate.slice(0, 7);

  const moveMonth = (offset: number) => {
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + offset);
    setVisibleMonth(nextMonth.toISOString().slice(0, 7));
  };

  return (
    <div className="mt-5 rounded-2xl border border-primary-100 bg-primary-50/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-primary-800">
            Seçilen teslimat günleri
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Toplam {dates.length} teslimat günü koyu renkle işaretlendi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Önceki ay"
            disabled={visibleMonth <= firstMonth}
            onClick={() => moveMonth(-1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-32 text-center text-sm font-black capitalize text-slate-900">
            {monthStart.toLocaleDateString("tr-TR", {
              month: "long",
              year: "numeric",
            })}
          </p>
          <button
            type="button"
            aria-label="Sonraki ay"
            disabled={visibleMonth >= lastMonth}
            onClick={() => moveMonth(1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(
          (day) => (
            <span
              key={day}
              className="py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500"
            >
              {day}
            </span>
          ),
        )}
        {Array.from({ length: leadingEmptyDays }).map((_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = new Date(
            monthStart.getFullYear(),
            monthStart.getMonth(),
            day,
            12,
          );
          const dateKey = date.toISOString().slice(0, 10);
          const inPeriod = dateKey >= startDate && dateKey <= endDate;
          const isDeliveryDay = selectedDateSet.has(dateKey);

          return (
            <span
              key={dateKey}
              title={
                isDeliveryDay
                  ? `${date.toLocaleDateString("tr-TR")} teslimat günü`
                  : undefined
              }
              className={`grid aspect-square min-h-9 place-items-center rounded-lg text-xs font-bold transition sm:text-sm ${
                isDeliveryDay
                  ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10"
                  : inPeriod
                    ? "bg-white text-slate-400"
                    : "text-slate-300"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-slate-900" /> Teslimat günü
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-slate-200 bg-white" />
          Teslimat yok
        </span>
      </div>
    </div>
  );
}

function weeklyChargePlan(serviceDates: string[], totalAmount: number) {
  if (!serviceDates.length) return [];
  const weeks = new Map<string, string[]>();
  [...serviceDates].sort().forEach((serviceDate) => {
    const date = new Date(`${serviceDate}T12:00:00`);
    const mondayOffset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - mondayOffset);
    const weekStart = date.toISOString().slice(0, 10);
    weeks.set(weekStart, [...(weeks.get(weekStart) || []), serviceDate]);
  });

  const totalCents = Math.round(totalAmount * 100);
  let allocatedCents = 0;
  return [...weeks.entries()].map(([weekStart, dates], index, entries) => {
    const amountCents =
      index === entries.length - 1
        ? totalCents - allocatedCents
        : Math.round((totalCents * dates.length) / serviceDates.length);
    allocatedCents += amountCents;
    const weekEnd = new Date(`${weekStart}T12:00:00`);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      chargeDate: dates[0],
      amount: amountCents / 100,
      serviceDayCount: dates.length,
      weekStart,
      weekEnd: weekEnd.toISOString().slice(0, 10),
    };
  });
}

export default function CreateSubscriptionPage() {
  const idempotencyKey = useRef(crypto.randomUUID());
  const [params] = useSearchParams();
  const storeId = Number(params.get("storeId"));
  const menuId = Number(params.get("menuId"));
  const renewFromId = Number(params.get("renewFrom"));
  const renewalPrefilled = useRef(false);
  const {
    addresses,
    activeAddressId,
    setActiveAddressId,
    isLoading: addressesLoading,
  } =
    useCustomerAddress();
  const initialAddress =
    Number(params.get("addressId")) ||
    activeAddressId;
  const [step, setStep] = useState(0);
  const [personCount, setPersonCount] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addressId, setAddressId] = useState<number | undefined>(
    initialAddress,
  );
  const [deliveryTime, setDeliveryTime] = useState("12:00");
  const [paymentMethodId, setPaymentMethodId] = useState<number>();
  const [commercialTermsAccepted, setCommercialTermsAccepted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdId, setCreatedId] = useState<number>();
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [lastPreview, setLastPreview] = useState<Awaited<ReturnType<typeof subscriptionService.preview>>>();

  useEffect(() => {
    if (!addressId && activeAddressId) setAddressId(activeAddressId);
  }, [activeAddressId, addressId]);
  const { data: store, isError: storeError } = useQuery({
    queryKey: ["store", storeId, addressId],
    queryFn: () => storeService.getStore(storeId, addressId),
    enabled: !!storeId && !!addressId,
  });
  const { data: menu } = useQuery({
    queryKey: ["menu", storeId, menuId],
    queryFn: () => storeService.getMenu(storeId, menuId),
    enabled: !!storeId && !!menuId,
  });
  const renewalQuery = useQuery({
    queryKey: ["subscription-renewal-source", renewFromId],
    queryFn: () => subscriptionService.getSubscription(renewFromId),
    enabled: Number.isFinite(renewFromId) && renewFromId > 0,
  });
  const deliveryTimesQuery = useQuery({
    queryKey: ["store-delivery-times", storeId, startDate, endDate],
    queryFn: () => storeService.getDeliveryTimes(storeId, startDate, endDate),
    enabled: !!storeId && !!startDate && !!endDate && endDate >= startDate,
  });
  const availableDeliveryTimes = deliveryTimesQuery.data;
  const { data: businessHours = [], isSuccess: businessHoursLoaded } =
    useQuery({
      queryKey: ["store-hours", storeId],
      queryFn: () => storeService.getBusinessHours(storeId),
      enabled: !!storeId,
    });
  const { data: paymentMethods = [], refetch: refetchPaymentMethods } =
    useQuery({
      queryKey: ["payment-methods"],
      queryFn: paymentService.methods,
    });
  useEffect(() => {
    if (!paymentMethodId && paymentMethods.length)
      setPaymentMethodId(
        (
          paymentMethods.find((method) => method.defaultMethod) ||
          paymentMethods[0]
        ).id,
      );
  }, [paymentMethodId, paymentMethods]);
  useEffect(() => {
    if (store)
      setPersonCount((value) =>
        Math.max(value, store.effectiveMinPersonCount ?? store.minPersonCount),
      );
  }, [store]);
  useEffect(() => {
    if (!store) return;
    if (!startDate && store.nextAvailableDeliveryDate)
      setStartDate(store.nextAvailableDeliveryDate);
    if (
      availableDeliveryTimes?.length &&
      !availableDeliveryTimes.some(
        (time) => time.slice(0, 5) === deliveryTime,
      )
    )
      setDeliveryTime(availableDeliveryTimes[0].slice(0, 5));
  }, [store, startDate, deliveryTime, availableDeliveryTimes]);
  useEffect(() => {
    if (renewalPrefilled.current || !renewalQuery.data || !store) return;
    const previous = renewalQuery.data.subscription;
    const earliest = tomorrowPlusTwo();
    const afterPrevious = new Date(`${previous.endDate}T12:00:00`);
    afterPrevious.setDate(afterPrevious.getDate() + 1);
    const possibleStarts = [
      earliest,
      afterPrevious.toISOString().slice(0, 10),
      store.nextAvailableDeliveryDate || earliest,
    ].sort();
    const newStart = possibleStarts[possibleStarts.length - 1];
    const durationDays = Math.max(
      1,
      Math.round(
        (Date.parse(previous.endDate) - Date.parse(previous.startDate)) /
          86_400_000,
      ) + 1,
    );
    const newEnd = new Date(`${newStart}T12:00:00`);
    newEnd.setDate(newEnd.getDate() + durationDays - 1);
    setPersonCount(previous.personCount);
    setAddressId(previous.addressId);
    setActiveAddressId(previous.addressId);
    setDeliveryTime(previous.deliveryTime.slice(0, 5));
    setStartDate(newStart);
    setEndDate(newEnd.toISOString().slice(0, 10));
    renewalPrefilled.current = true;
  }, [renewalQuery.data, setActiveAddressId, store]);

  const input: SubscriptionInput = {
    storeId,
    menuId,
    addressId: addressId || 0,
    personCount,
    deliveryTime,
    startDate,
    endDate,
    paymentMethodId,
    commercialTermsAccepted,
    couponCode: couponCode || undefined,
  };
  const previewMutation = useMutation({
    mutationFn: subscriptionService.preview,
    onSuccess: (data) => {
      setLastPreview(data);
      setError("");
      setFieldErrors({});
      setStep(3);
    },
    onError: (err: unknown) => {
      const parsed = parseApiError(err, "Abonelik bilgileri doğrulanamadı.");
      setError(parsed.message);
      setFieldErrors(parsed.fields);
    },
  });
  const createMutation = useMutation({
    mutationFn: (data: SubscriptionInput) =>
      subscriptionService.create(data, idempotencyKey.current),
    onSuccess: (subscription) => {
      setCreatedId(subscription.id);
    },
    onError: (err: unknown) => {
      const parsed = parseApiError(err, "Abonelik talebi oluşturulamadı.");
      setError(parsed.message);
      setFieldErrors(parsed.fields);
    },
  });

  const previewIsCurrent = previewMutation.isSuccess && !previewMutation.isPending
    && previewMutation.variables?.storeId === storeId
    && previewMutation.variables?.menuId === menuId
    && previewMutation.variables?.addressId === addressId
    && previewMutation.variables?.personCount === personCount
    && previewMutation.variables?.deliveryTime === deliveryTime
    && previewMutation.variables?.startDate === startDate
    && previewMutation.variables?.endDate === endDate
    && (previewMutation.variables?.couponCode || "") === couponCode;

  useEffect(() => {
    if (step !== 3) return;
    const timer = window.setTimeout(() => previewMutation.mutate(input), 450);
    return () => window.clearTimeout(timer);
    // Kupon değiştiğinde fiyatı tekrar sunucudan hesaplatır; diğer alanlar adımlarda güncellenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- input and mutation are intentionally read only when the coupon changes.
  }, [couponCode]);

  const next = () => {
    setError("");
    if (step === 0) {
      const minimum =
        store?.effectiveMinPersonCount ?? store?.minPersonCount ?? 1;
      if (personCount < minimum)
        return setError(`Bu adres için en az ${minimum} kişi seçmelisiniz.`);
      setStep(1);
    } else if (step === 1) {
      if (!startDate || !endDate)
        return setError("Başlangıç ve bitiş tarihlerini seçin.");
      if (endDate < startDate)
        return setError("Bitiş tarihi başlangıç tarihinden önce olamaz.");
      if (Date.parse(endDate) - Date.parse(startDate) >= 730 * 86400000)
        return setError("Tek abonelik dönemi en fazla 730 takvim günü olabilir.");
      setStep(2);
    } else if (step === 2) {
      if (!addressId) return setError("Teslimat adresini seçin.");
      if (!availableDeliveryTimes?.length || deliveryTimesQuery.isFetching || deliveryTimesQuery.isError) {
        return setError(
          "Seçilen dönem için uygun teslimat saati bulunamadı. Tarihleri veya işletmeyi değiştirebilirsiniz.",
        );
      }
      if (
        !availableDeliveryTimes.some(
          (time) => time.slice(0, 5) === deliveryTime,
        )
      ) {
        return setError("Lütfen işletmenin sunduğu teslimat saatlerinden birini seçin.");
      }
      previewMutation.mutate(input);
    }
  };

  const selectDuration = (
    amount: number,
    unit: (typeof quickDurations)[number]["unit"],
  ) => {
    if (!startDate) return;
    const end = new Date(`${startDate}T12:00:00`);
    if (unit === "week") {
      end.setDate(end.getDate() + amount * 7 - 1);
    } else {
      const originalDay = end.getDate();
      end.setDate(1);
      end.setMonth(end.getMonth() + amount);
      const lastDayOfTargetMonth = new Date(
        end.getFullYear(),
        end.getMonth() + 1,
        0,
      ).getDate();
      end.setDate(Math.min(originalDay, lastDayOfTargetMonth));
      end.setDate(end.getDate() - 1);
    }
    setEndDate(end.toISOString().slice(0, 10));
    setError("");
  };

  const submitSubscription = () => {
    setError("");
    if (!previewIsCurrent) {
      setError("Güncel tutar hesaplanmadan talep gönderilemez. Önizlemeyi yenileyin.");
      return;
    }
    if (!paymentMethodId) {
      setError("Devam etmek için kayıtlı bir ödeme yöntemi seçin.");
      return;
    }
    if (!commercialTermsAccepted) {
      setError("Mesafeli satış ve abonelik koşullarını onaylayın.");
      return;
    }
    createMutation.mutate(input);
  };

  if (createdId)
    return (
      <div className="mx-auto max-w-xl">
        <div className="mf-surface p-8 text-center sm:p-12">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success-100">
            <CheckCircle2 className="h-10 w-10 text-success-600" />
          </div>
          <h1 className="mt-6 text-2xl font-black text-ink">
            Talebiniz satıcıya gönderildi
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Satıcının yanıtını Aboneliklerim alanından takip edebilirsiniz.
            Durum değiştiğinde size bildirim göndereceğiz.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to={`/subscriptions/${createdId}`}>
              <Button>Talebi görüntüle</Button>
            </Link>
            <Link to="/stores">
              <Button variant="outline">İşletmelere dön</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  if (!addressesLoading && !addresses.length)
    return (
      <div className="mf-page">
        <EmptyState
          title="Önce teslimat adresi ekleyin"
          description="Abonelik seçeneklerini ve uygun teslimat saatlerini adresinize göre belirliyoruz. Devam etmek için bir iş yeri adresi ekleyin."
          icon={<MapPin className="h-6 w-6" />}
          action={
            <Link to="/addresses">
              <Button>Adres ekle</Button>
            </Link>
          }
        />
      </div>
    );
  if (storeError)
    return (
      <div className="mf-page">
        <EmptyState
          title="Bu işletme seçili adresinize hizmet vermiyor"
          description="Teslimat adresinizi değiştirebilir veya diğer işletmeleri inceleyebilirsiniz."
          action={
            <Link to="/stores">
              <Button>İşletmeleri keşfet</Button>
            </Link>
          }
        />
      </div>
    );
  if (addressesLoading || !store || !menu || !addressId)
    return <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />;
  const preview = previewMutation.data ?? lastPreview;
  const selectedAddress = addresses.find((address) => address.id === addressId);
  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.id === paymentMethodId,
  );
  const openDays = businessHoursLoaded
    ? new Set(
        businessHours
          .filter((businessHour) => businessHour.open)
          .map((businessHour) => businessHour.dayOfWeek),
      )
    : undefined;
  const calendarDates = selectedDates(startDate, endDate, openDays);
  const grossAmount = preview
    ? preview.pricePerPerson * personCount * preview.serviceDayCount
    : 0;
  const discountAmount = preview
    ? Math.max(0, grossAmount - preview.totalAmount)
    : 0;
  const weeklyCharges = preview
    ? weeklyChargePlan(preview.serviceDates, preview.totalAmount)
    : [];

  return (
    <div className="mf-page max-w-6xl">
      <Link
        to={`/stores/${storeId}?addressId=${addressId}`}
        className="inline-flex items-center gap-1 text-sm font-bold text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" /> {store.name}
      </Link>
      <PageHeader
        eyebrow="Abonelik oluştur"
        title="Yeni abonelik talebi"
        description="Menü, teslimat ve ödeme bilgilerinizi adım adım tamamlayın. Talebiniz satıcı onayından sonra başlar."
      />
      <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-8">
          <ol
            className="mt-7 grid grid-cols-5 gap-2"
            aria-label="Abonelik oluşturma adımları"
          >
            {steps.map((label, index) => {
              const visualStep = step + 1;
              const completed = index < visualStep;
              const active = index === visualStep;
              return (
                <li key={label}>
                  <button
                    type="button"
                    disabled={index === 0 || index > visualStep}
                    onClick={() => setStep(index - 1)}
                    aria-current={active ? "step" : undefined}
                    className="w-full text-left disabled:cursor-default"
                  >
                    <span
                      className={`block h-1.5 rounded-full ${completed || active ? "bg-primary-600" : "bg-slate-200"}`}
                    />
                    <span
                      className={`mt-2 hidden text-xs font-semibold sm:block ${active ? "text-primary-600" : completed ? "text-slate-700" : "text-slate-500"}`}
                    >
                      {completed && <Check className="mr-1 inline h-3 w-3" />}
                      {index + 1}. {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {error && (
            <div className="mt-6 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              <p>{error}</p>
              {Object.entries(fieldErrors).length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {Object.entries(fieldErrors).map(([field, message]) => (
                    <li key={field}>
                      <strong>{field}:</strong> {message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="mt-8 min-h-72">
            {step === 3 && (
              <section className="mb-7">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-600">
                    <CreditCard />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Ödeme yöntemi</h2>
                    <p className="text-sm text-slate-500">
                      Tutar yalnız satıcı talebi onayladığında tahsil edilir.
                    </p>
                  </div>
                </div>
                <label className="mt-5 block text-sm font-semibold text-slate-700">
                  Kupon veya kurumsal kod
                  <input
                    value={couponCode}
                    onChange={(event) =>
                      setCouponCode(event.target.value.toUpperCase())
                    }
                    placeholder="Örn. HOSGELDIN10"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                  />
                </label>
                <div className="mt-5 grid gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethodId(method.id)}
                      className={`flex items-center justify-between rounded-xl border p-4 text-left ${paymentMethodId === method.id ? "border-primary-500 bg-primary-50 ring-2 ring-primary-100" : "border-slate-200"}`}
                    >
                      <span>
                        <strong>
                          {method.brand} •••• {method.lastFour}
                        </strong>
                        <span className="mt-1 block text-xs text-slate-500">
                          Son kullanım{" "}
                          {String(method.expiryMonth).padStart(2, "0")}/
                          {method.expiryYear}
                        </span>
                      </span>
                      {paymentMethodId === method.id && (
                        <Check className="h-5 w-5 text-primary-600" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <MockCardTokenizationForm
                    onAdded={async (method) => {
                      await refetchPaymentMethods();
                      setPaymentMethodId(method.id);
                    }}
                  />
                </div>
                <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6">
                  <input
                    type="checkbox"
                    checked={commercialTermsAccepted}
                    onChange={(event) =>
                      setCommercialTermsAccepted(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-primary-600"
                  />
                  <span>
                    <strong>
                      Mesafeli satış ve abonelik koşullarını okudum, kabul
                      ediyorum.
                    </strong>
                    <span className="block text-xs text-slate-500">
                      Satıcı onayında toplam tutar tahsil edilir. İptalde teslim
                      edilmemiş günler oranında iade uygulanır.
                    </span>
                  </span>
                </label>
              </section>
            )}
            {step === 0 && (
              <section>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-600">
                    <Users />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">
                      Kaç kişilik yemek istiyorsunuz?
                    </h2>
                    <p className="text-sm text-slate-500">
                      Bu adres için minimum{" "}
                      {store.effectiveMinPersonCount ?? store.minPersonCount}{" "}
                      kişi.
                    </p>
                  </div>
                </div>
                <PersonCountSelector
                  value={personCount}
                  minimum={store.effectiveMinPersonCount ?? store.minPersonCount}
                  maximum={store.maxPersonCount || 999}
                  onChange={setPersonCount}
                />
                {store.maxPersonCount && (
                  <p className="mt-5 text-center text-sm text-slate-500">
                    Maksimum {store.maxPersonCount} kişi
                  </p>
                )}
              </section>
            )}
            {step === 1 && (
              <section>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-600">
                    <CalendarDays />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">
                      Abonelik tarihlerini belirleyin
                    </h2>
                    <p className="text-sm text-slate-500">
                      En az 5 gerçek hizmet günü seçmelisiniz.
                    </p>
                  </div>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Başlangıç tarihi
                    <input
                      type="date"
                      min={tomorrowPlusTwo()}
                      value={startDate}
                      onChange={(event) => {
                        setStartDate(event.target.value);
                        if (endDate < event.target.value) setEndDate("");
                      }}
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
                    />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    Bitiş tarihi
                    <input
                      type="date"
                      min={startDate || tomorrowPlusTwo()}
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal"
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Hızlı dönem seçimi:
                  </span>
                  {quickDurations.map((duration) => (
                    <button
                      key={`${duration.unit}-${duration.amount}`}
                      type="button"
                      disabled={!startDate}
                      onClick={() =>
                        selectDuration(duration.amount, duration.unit)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {duration.label} seç
                    </button>
                  ))}
                </div>
                {calendarDates.length > 0 && (
                  <SelectedDeliveryCalendar
                    dates={calendarDates}
                    startDate={startDate}
                    endDate={endDate}
                  />
                )}
                <div className="mt-6 rounded-xl bg-warning-50 p-4 text-sm leading-6 text-warning-800">
                  En az 5 hizmet günü kuralı, işletmenin açık günleri ve resmî
                  tatiller önizlemede kesin olarak hesaplanır.
                </div>
              </section>
            )}
            {step === 2 && (
              <section>
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-600">
                    <MapPin />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Teslimat bilgileri</h2>
                    <p className="text-sm text-slate-500">
                      Yemeğin nereye ve saat kaçta geleceğini seçin.
                    </p>
                  </div>
                </div>
                <div className="mt-7 space-y-4">
                  <div className="grid gap-3">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        onClick={() => {
                          setAddressId(address.id);
                          setActiveAddressId(address.id);
                        }}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left ${addressId === address.id ? "border-primary-500 bg-primary-50 ring-2 ring-primary-100" : "border-slate-200"}`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border ${addressId === address.id ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300"}`}
                        >
                          {addressId === address.id && (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                        <span>
                          <strong className="block text-sm">
                            {address.title}
                          </strong>
                          <span className="mt-1 block text-xs text-slate-500">
                            {address.fullAddress ||
                              `${address.city} / ${address.district}`}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Uygun teslimat saati
                    <div className="relative mt-2">
                      {deliveryTimesQuery.isPending || deliveryTimesQuery.isFetching ? (
                        <p role="status" className="py-3 text-sm text-slate-600">Uygun teslimat saatleri yükleniyor...</p>
                      ) : deliveryTimesQuery.isError ? (
                        <div role="alert" className="rounded-xl bg-danger-50 p-3 text-danger-700">
                          Teslimat saatleri yüklenemedi.
                          <button type="button" onClick={() => deliveryTimesQuery.refetch()} className="ml-2 underline">Tekrar dene</button>
                        </div>
                      ) : availableDeliveryTimes?.length ? (
                        <select
                          value={deliveryTime}
                          onChange={(event) =>
                            setDeliveryTime(event.target.value)
                          }
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 font-normal"
                        >
                          {availableDeliveryTimes.map((time) => (
                            <option key={time} value={time.slice(0, 5)}>
                              {time.slice(0, 5)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          Seçilen dönemin tüm hizmet günlerine uygun teslimat
                          saati bulunmuyor. Tarihleri veya işletmeyi değiştirebilirsiniz.
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </section>
            )}
            {step === 3 && preview && (
              <section>
                <h2 className="text-xl font-black">Abonelik özetiniz</h2>
                {!previewIsCurrent && (
                  <div role="status" className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    Güncel tutar henüz doğrulanmadı.
                    <button
                      type="button"
                      disabled={previewMutation.isPending}
                      onClick={() => previewMutation.mutate(input)}
                      className="ml-2 font-semibold underline disabled:opacity-50"
                    >
                      {previewMutation.isPending ? "Hesaplanıyor..." : "Önizlemeyi yenile"}
                    </button>
                  </div>
                )}
                <div className="mt-6 divide-y rounded-2xl border border-slate-200 px-5">
                  {[
                    ["Menü", menu.name],
                    [
                      "Menü sürümü",
                      preview.priceEffectiveFrom
                        ? `Fiyat geçerliliği: ${new Date(preview.priceEffectiveFrom).toLocaleDateString("tr-TR")}`
                        : "Mevcut menü sürümü",
                    ],
                    ["Kişi sayısı", `${personCount} kişi`],
                    [
                      "Hizmet dönemi",
                      `${new Date(startDate).toLocaleDateString("tr-TR")} – ${new Date(endDate).toLocaleDateString("tr-TR")}`,
                    ],
                    ["Gerçek hizmet günü", `${preview.serviceDayCount} gün`],
                    ["Mesafe", `${preview.distanceKm} km`],
                    ["Teslimat", `${selectedAddress?.title} · ${deliveryTime}`],
                    [
                      "Ödeme yöntemi",
                      selectedPaymentMethod
                        ? `${selectedPaymentMethod.brand} •••• ${selectedPaymentMethod.lastFour}`
                        : "Ödeme yöntemi seçilmedi",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 py-3 text-sm"
                    >
                      <span className="text-slate-500">{label}</span>
                      <strong className="text-right text-slate-800">
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>
                {preview.excludedDates.length > 0 && (
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    {preview.excludedDates.length} kapalı/çalışılmayan gün
                    toplamdan çıkarıldı.
                  </p>
                )}
                <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between gap-3">
                      <span>
                        {preview.pricePerPerson.toLocaleString("tr-TR")} ₺ ×{" "}
                        {personCount} kişi × {preview.serviceDayCount} gün
                      </span>
                      <span>{grossAmount.toLocaleString("tr-TR")} ₺</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between gap-3 text-success-300">
                        <span>
                          {couponCode
                            ? `Kupon indirimi (${couponCode})`
                            : "İndirim"}
                        </span>
                        <span>−{discountAmount.toLocaleString("tr-TR")} ₺</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-end justify-between border-t border-white/15 pt-3">
                    <span className="font-semibold">Toplam tutar</span>
                    <span className="text-3xl font-black text-warning-300">
                      {preview.totalAmount.toLocaleString("tr-TR")} ₺
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm font-semibold leading-6 text-primary-800">
                  Ücret, haftalık olarak kayıtlı ödeme aracınızdan tahsil
                  edilecektir.
                </div>
                {weeklyCharges.length > 0 && (
                  <details className="group mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-bold text-slate-800">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary-600" />
                        Haftalık tahsilat takvimini görüntüle
                      </span>
                      <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-slate-200 bg-slate-50 p-4">
                      <p className="mb-3 text-xs leading-5 text-slate-600">
                        Her takvim haftasının ücreti, o haftanın ilk teslimat
                        günü saat 09:00'da kayıtlı ödeme aracınızdan tahsil
                        edilir.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {weeklyCharges.map((charge) => (
                          <article
                            key={charge.weekStart}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                              {new Date(
                                `${charge.weekStart}T12:00:00`,
                              ).toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              –{" "}
                              {new Date(
                                `${charge.weekEnd}T12:00:00`,
                              ).toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                            <div className="mt-2 flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-slate-900">
                                  {new Date(
                                    `${charge.chargeDate}T12:00:00`,
                                  ).toLocaleDateString("tr-TR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                  })}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  09:00 · {charge.serviceDayCount} teslimat günü
                                </p>
                              </div>
                              <strong className="shrink-0 text-base text-primary-700">
                                {charge.amount.toLocaleString("tr-TR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                ₺
                              </strong>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </details>
                )}
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Talebiniz önce satıcı onayına gönderilir. Onaylanana kadar
                  durumunuz “Onay bekliyor” olarak görünür.
                </p>
              </section>
            )}
          </div>

          <div className="mt-7 flex items-center justify-between border-t pt-5">
            <button
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0 || previewMutation.isPending || createMutation.isPending}
              className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 disabled:invisible"
            >
              <ArrowLeft className="h-4 w-4" /> Geri
            </button>
            {step < 3 ? (
              <button
                onClick={next}
                disabled={
                  previewMutation.isPending ||
                  (step === 2 && (!availableDeliveryTimes?.length || deliveryTimesQuery.isFetching || deliveryTimesQuery.isError))
                }
                className="flex items-center gap-1 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {previewMutation.isPending ? "Hesaplanıyor..." : "Devam Et"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={submitSubscription}
                disabled={createMutation.isPending || !previewIsCurrent}
                className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {createMutation.isPending
                  ? "Gönderiliyor..."
                  : "Abonelik Talebini Gönder"}
              </button>
            )}
          </div>
        </main>

        <aside className="hidden h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:sticky lg:top-24 lg:block">
          <p className="text-xs font-black uppercase tracking-[.12em] text-primary-600">
            Seçtiğiniz menü
          </p>
          <h2 className="mt-2 text-lg font-black text-ink">{store.name}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {menu.name}
          </p>
          <p className="mt-3 text-2xl font-black text-primary-600">
            {menu.pricePerPerson.toLocaleString("tr-TR")} ₺{" "}
            <span className="text-xs font-normal text-slate-500">
              / kişi / gün
            </span>
          </p>
          <div className="mt-5 border-t pt-4">
            <p className="text-xs font-bold text-slate-700">Sunulan yemek çeşitleri</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Günlük menü üretim planına göre değişebilir.</p>
            {menu.items.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {menu.items.map((item) => (
                  <span key={item.id} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                    {item.name}{item.description ? ` · ${item.description}` : ""}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-floating lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(true)}
          className="flex min-h-12 w-full items-center justify-between rounded-xl bg-slate-950 px-4 text-left text-white"
        >
          <span>
            <span className="block text-xs text-slate-300">
              Seçtiğiniz menü
            </span>
            <strong className="block text-sm">{menu.name}</strong>
          </span>
          <span className="text-sm font-black text-warning-300">Özeti aç</span>
        </button>
      </div>
      <Drawer
        open={mobileSummaryOpen}
        title="Abonelik özeti"
        onClose={() => setMobileSummaryOpen(false)}
      >
        <p className="text-xs font-black uppercase tracking-[.12em] text-primary-600">
          Seçtiğiniz menü
        </p>
        <h2 className="mt-1 text-lg font-black">{store.name}</h2>
        <p className="text-sm font-semibold text-slate-600">{menu.name}</p>
        <p className="mt-4 text-2xl font-black text-primary-600">
          {menu.pricePerPerson.toLocaleString("tr-TR")} ₺{" "}
          <span className="text-xs font-normal text-slate-500">
            / kişi / gün
          </span>
        </p>
        <div className="mt-5 border-t pt-4">
          <p className="text-xs font-bold text-slate-700">Sunulan yemek çeşitleri</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Günlük menü üretim planına göre değişebilir.</p>
          {menu.items.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {menu.items.map((item) => (
                <span key={item.id} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                  {item.name}{item.description ? ` · ${item.description}` : ""}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Drawer>
    </div>
  );
}
