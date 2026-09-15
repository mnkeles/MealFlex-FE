import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import type { Store } from "@/types";
import StoreAddressFields, {
  emptyStoreAddress,
} from "@/components/seller/StoreAddressFields";
import LocationSelects from "@/components/address/LocationSelects";
import { parseApiError } from "@/utils/apiErrors";
import ConfirmModal from "@/components/common/ConfirmModal";
import { discoveryLabels } from "@/constants/discovery";
import DeliverySlotRangePicker from "@/components/seller/DeliverySlotRangePicker";
import StatusBadge from "@/components/ui/StatusBadge";
import useUnsavedChanges from "@/hooks/useUnsavedChanges";
import {
  confirmSellerStoreNavigation,
  subscribeToSellerStoreNavigation,
} from "@/utils/sellerStoreNavigation";

type DistanceRuleDraft = {
  id?: number;
  distanceKm: string;
  minPersonCount: string;
};

const minimumClosedDate = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 2);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const serviceDayChangeEffectiveDate = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
  date.setDate(date.getDate() + daysUntilNextMonday + 7);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const categoryOptions = [
  "TURK_MUTFAGI",
  "EV_YEMEKLERI",
  "SAGLIKLI",
  "VEGAN",
  "IZGARA",
  "SULU_YEMEK",
  "DUNYA_MUTFAGI",
  "FIT_MENULER",
];

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const dayLabels: Record<string, string> = {
  MONDAY: "Pazartesi",
  TUESDAY: "Salı",
  WEDNESDAY: "Çarşamba",
  THURSDAY: "Perşembe",
  FRIDAY: "Cuma",
  SATURDAY: "Cumartesi",
  SUNDAY: "Pazar",
};
const settingsSections = [
  { id: "store-profile", label: "Genel" },
  { id: "business-hours", label: "Çalışma saatleri" },
  { id: "delivery-slots", label: "Teslimat saatleri" },
  { id: "service-areas", label: "Hizmet bölgeleri" },
  { id: "closed-days", label: "Kapalı günler" },
  { id: "store-status", label: "Hizmet Kuralları" },
];

const formFromStore = (store: Store) => ({
  name: store.name || "",
  description: store.description || "",
  maxPersonCount: store.maxPersonCount ? String(store.maxPersonCount) : "",
  dailyCapacity: store.dailyCapacity ? String(store.dailyCapacity) : "",
  changeCutoffHours: String(store.changeCutoffHours || 24),
  productionAddress: store.productionAddress || "",
  addressTitle: store.addressTitle || "",
  city: store.city || "",
  district: store.district || "",
  neighborhood: store.neighborhood || "",
  street: store.street || "",
  buildingNo: store.buildingNo || "",
  floor: store.floor || "",
  apartmentNo: store.apartmentNo || "",
  directions: store.directions || "",
  logoUrl: store.logoUrl || "",
  coverImageUrl: store.coverImageUrl || "",
  categories: store.categories || [],
  latitude: String(store.latitude ?? 39.9334),
  longitude: String(store.longitude ?? 32.8597),
});

const hoursFromResponse = (
  values: { dayOfWeek: string; open: boolean; openTime?: string; closeTime?: string }[],
) =>
  days.map((dayOfWeek) => {
    const saved = values.find((value) => value.dayOfWeek === dayOfWeek);
    return saved
      ? {
          dayOfWeek,
          open: saved.open,
          openTime: saved.openTime || "11:00",
          closeTime: saved.closeTime || "15:00",
        }
      : {
          dayOfWeek,
          open: dayOfWeek !== "SUNDAY",
          openTime: "11:00",
          closeTime: "15:00",
        };
  });

const savedStorePayload = (store: Store) => ({
  name: store.name,
  description: store.description,
  maxPersonCount: store.maxPersonCount,
  dailyCapacity: store.dailyCapacity,
  changeCutoffHours: store.changeCutoffHours,
  productionAddress: store.productionAddress,
  addressTitle: store.addressTitle,
  city: store.city,
  district: store.district,
  neighborhood: store.neighborhood,
  street: store.street,
  buildingNo: store.buildingNo,
  floor: store.floor,
  apartmentNo: store.apartmentNo,
  directions: store.directions,
  logoUrl: store.logoUrl,
  coverImageUrl: store.coverImageUrl,
  categories: store.categories,
  latitude: store.latitude ?? 39.9334,
  longitude: store.longitude ?? 32.8597,
});

export default function StoreSettingsPage() {
  const { storeId, store } = useOutletContext<{
    storeId: number;
    store?: Store;
  }>();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    description: "",
    maxPersonCount: "",
    dailyCapacity: "",
    changeCutoffHours: "24",
    logoUrl: "",
    coverImageUrl: "",
    categories: [] as string[],
    ...emptyStoreAddress,
  });
  const [areaForm, setAreaForm] = useState({
    city: "Ankara",
    district: "",
    neighborhood: "",
  });
  const [storeFormError, setStoreFormError] = useState<{
    message: string;
    fields: Record<string, string>;
  }>();
  const [distanceRuleDrafts, setDistanceRuleDrafts] = useState<
    DistanceRuleDraft[]
  >([]);
  const [distanceRuleError, setDistanceRuleError] = useState("");
  const [distanceRuleSuccess, setDistanceRuleSuccess] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    type: "area" | "closedDate";
    id: number;
  }>();
  const [pendingDayClosure, setPendingDayClosure] = useState<string>();
  const [deliverySlots, setDeliverySlots] = useState<string[]>([]);
  const [deliverySlotError, setDeliverySlotError] = useState("");
  const [deliverySlotSuccess, setDeliverySlotSuccess] = useState("");
  const [hours, setHours] = useState(
    days.map((d) => ({
      dayOfWeek: d,
      open: d !== "SUNDAY",
      openTime: "11:00",
      closeTime: "15:00",
    })),
  );

  useEffect(() => {
    if (store) {
      setForm(formFromStore(store));
    }
  }, [store]);

  const { data: businessHours } = useQuery({
    queryKey: ["store-hours", storeId],
    queryFn: () => sellerService.getBusinessHours(storeId),
    enabled: !!storeId,
  });

  useEffect(() => {
    if (businessHours) setHours(hoursFromResponse(businessHours));
  }, [businessHours]);

  const { data: savedDeliverySlots, isPending: deliverySlotsLoading, isError: deliverySlotsLoadError, refetch: reloadDeliverySlots } = useQuery({
    queryKey: ["store-delivery-slots", storeId],
    queryFn: () => sellerService.getDeliverySlots(storeId),
    enabled: !!storeId,
  });

  useEffect(() => {
    if (!savedDeliverySlots) return;
    setDeliverySlots(
      savedDeliverySlots.map((slot) => slot.deliveryTime.slice(0, 5)),
    );
  }, [savedDeliverySlots]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof sellerService.updateStoreById>[1]) =>
      sellerService.updateStoreById(storeId, data),
    onSuccess: () => {
      setStoreFormError(undefined);
      queryClient.invalidateQueries({
        queryKey: ["seller-store", storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["seller-stores"] });
    },
  });

  const hoursMutation = useMutation({
    mutationFn: (
      hours: Parameters<typeof sellerService.setBusinessHoursForStore>[1],
    ) => sellerService.setBusinessHoursForStore(storeId, hours),
    onSuccess: () => {
      setPendingDayClosure(undefined);
      queryClient.invalidateQueries({ queryKey: ["store-hours", storeId] });
    },
  });

  const deliverySlotsMutation = useMutation({
    mutationFn: (slots: string[]) =>
      sellerService.setDeliverySlots(storeId, slots),
    onSuccess: (savedSlots) => {
      setDeliverySlots(savedSlots.map((slot) => slot.deliveryTime.slice(0, 5)));
      setDeliverySlotError("");
      setDeliverySlotSuccess("Teslimat saatleri kaydedildi.");
      queryClient.invalidateQueries({
        queryKey: ["store-delivery-slots", storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["seller-stores"] });
    },
    onError: (error: unknown) =>
      setDeliverySlotError(
        parseApiError(error, "Teslimat saatleri kaydedilemedi.").message,
      ),
  });

  const confirmDayClosure = () => {
    if (!pendingDayClosure) return;
    setHours((current) =>
      current.map((hour) =>
        hour.dayOfWeek === pendingDayClosure
          ? { ...hour, open: false }
          : hour,
      ),
    );
    setPendingDayClosure(undefined);
  };

  const areaMutation = useMutation({
    mutationFn: (data: { city: string; district: string }) =>
      sellerService.addServiceAreaForStore(storeId, data),
    onSuccess: () => {
      setAreaForm({ city: areaForm.city, district: "", neighborhood: "" });
      queryClient.invalidateQueries({ queryKey: ["store-areas", storeId] });
    },
  });

  const { data: serviceAreas = [] } = useQuery({
    queryKey: ["store-areas", storeId],
    queryFn: () => sellerService.getServiceAreas(storeId),
    enabled: !!storeId,
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (areaId: number) =>
      sellerService.deleteServiceArea(storeId, areaId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["store-areas", storeId] }),
  });

  const { data: distanceRules, isLoading: distanceRulesLoading } =
    useQuery({
    queryKey: ["store-distance-rules", storeId],
    queryFn: () => sellerService.getDistanceRules(storeId),
    enabled: !!storeId,
  });

  useEffect(() => {
    if (!distanceRules) return;
    setDistanceRuleDrafts(
      distanceRules.map((rule) => ({
        id: rule.id,
        distanceKm: String(rule.distanceKm),
        minPersonCount: String(rule.minPersonCount),
      })),
    );
  }, [distanceRules]);

  const { data: closedDates = [] } = useQuery({
    queryKey: ["store-closed-dates", storeId],
    queryFn: () => sellerService.getClosedDates(storeId),
    enabled: !!storeId,
  });

  const [closedDateForm, setClosedDateForm] = useState({
    closedDate: "",
    endDate: "",
    reason: "",
  });
  const [closedDateMode, setClosedDateMode] = useState<"single" | "range">("single");
  const [closedDateError, setClosedDateError] = useState("");
  const [closedDateSuccess, setClosedDateSuccess] = useState("");
  const earliestClosedDate = minimumClosedDate();

  const addClosedDateMutation = useMutation({
    mutationFn: () =>
      closedDateMode === "range"
        ? sellerService.addClosedDateRange(storeId, {
            startDate: closedDateForm.closedDate,
            endDate: closedDateForm.endDate,
            reason: closedDateForm.reason || undefined,
          })
        : sellerService.addClosedDate(storeId, {
            closedDate: closedDateForm.closedDate,
            reason: closedDateForm.reason || undefined,
          }).then((result) => [result]),
    onSuccess: (result) => {
      const addedCount = result.length;
      setClosedDateForm({ closedDate: "", endDate: "", reason: "" });
      setClosedDateError("");
      setClosedDateSuccess(
        addedCount === 1 ? "Kapalı gün eklendi." : `${addedCount} kapalı gün eklendi.`,
      );
      queryClient.invalidateQueries({
        queryKey: ["store-closed-dates", storeId],
      });
    },
    onError: (error: unknown) =>
      setClosedDateError(
        parseApiError(error, "Kapalı gün kaydedilemedi.").message,
      ),
  });

  const deleteClosedDateMutation = useMutation({
    mutationFn: (id: number) => sellerService.deleteClosedDate(storeId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["store-closed-dates", storeId],
      }),
  });

  const publishMutation = useMutation({
    mutationFn: () => sellerService.publishStore(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-store"] });
      queryClient.invalidateQueries({ queryKey: ["seller-stores"] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => sellerService.suspendStore(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-store"] });
      queryClient.invalidateQueries({ queryKey: ["seller-stores"] });
    },
  });

  const dirtySections: Record<string, boolean> = {
    "store-profile": Boolean(
      store && JSON.stringify(form) !== JSON.stringify(formFromStore(store)),
    ),
    "business-hours": Boolean(
      businessHours &&
        JSON.stringify(hours) !== JSON.stringify(hoursFromResponse(businessHours)),
    ),
    "delivery-slots": Boolean(
      savedDeliverySlots &&
        JSON.stringify(deliverySlots) !==
          JSON.stringify(
            savedDeliverySlots.map((slot) => slot.deliveryTime.slice(0, 5)),
          ),
    ),
    "service-areas":
      Boolean(areaForm.district || areaForm.neighborhood) ||
      Boolean(
        distanceRules &&
          JSON.stringify(distanceRuleDrafts) !==
            JSON.stringify(
              distanceRules.map((rule) => ({
                id: rule.id,
                distanceKm: String(rule.distanceKm),
                minPersonCount: String(rule.minPersonCount),
              })),
            ),
      ),
    "closed-days": Boolean(
      closedDateForm.closedDate || closedDateForm.endDate || closedDateForm.reason,
    ),
    "store-status": false,
  };
  const hasUnsavedChanges = Object.values(dirtySections).some(Boolean);

  useUnsavedChanges(hasUnsavedChanges);
  useEffect(
    () =>
      subscribeToSellerStoreNavigation((event) => {
        if (
          hasUnsavedChanges &&
          !window.confirm(
            "Kaydedilmemiş mağaza ayarları var. Geçiş yaparsanız bu değişiklikler kaybolacak. Devam etmek istiyor musunuz?",
          )
        ) {
          event.preventDefault();
        }
      }),
    [hasUnsavedChanges],
  );

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      maxPersonCount: form.maxPersonCount
        ? Number(form.maxPersonCount)
        : undefined,
      dailyCapacity: form.dailyCapacity ? Number(form.dailyCapacity) : undefined,
      changeCutoffHours: Number(form.changeCutoffHours),
      productionAddress: form.productionAddress || undefined,
      addressTitle: form.addressTitle || undefined,
      city: form.city || undefined,
      district: form.district || undefined,
      neighborhood: form.neighborhood || undefined,
      street: form.street || undefined,
      buildingNo: form.buildingNo || undefined,
      floor: form.floor || undefined,
      apartmentNo: form.apartmentNo || undefined,
      directions: form.directions || undefined,
      logoUrl: form.logoUrl || undefined,
      coverImageUrl: form.coverImageUrl || undefined,
      categories: form.categories,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    });
  };

  const distanceRuleMutation = useMutation({
    mutationFn: (rules: { distanceKm: number; minPersonCount: number }[]) =>
      sellerService.updateStoreById(storeId, {
        ...savedStorePayload(store!),
        maxDeliveryDistanceKm: rules[rules.length - 1].distanceKm,
        distanceRules: rules,
      }),
    onSuccess: () => {
      setDistanceRuleError("");
      setDistanceRuleSuccess("Mesafe kuralları kaydedildi.");
      queryClient.invalidateQueries({
        queryKey: ["store-distance-rules", storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["seller-stores"] });
    },
    onError: (error: unknown) => {
      setDistanceRuleSuccess("");
      setDistanceRuleError(
        parseApiError(error, "Mesafe kuralları kaydedilemedi.").message,
      );
    },
  });

  const updateDistanceRule = (
    index: number,
    field: "distanceKm" | "minPersonCount",
    value: string,
  ) => {
    setDistanceRuleSuccess("");
    setDistanceRuleDrafts((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [field]: value } : rule,
      ),
    );
  };

  const addDistanceRule = () => {
    const previousDistance = Number(
      distanceRuleDrafts[distanceRuleDrafts.length - 1]?.distanceKm || 0,
    );
    setDistanceRuleSuccess("");
    setDistanceRuleDrafts((current) => [
      ...current,
      {
        distanceKm: previousDistance < 30 ? String(previousDistance + 1) : "",
        minPersonCount:
          current[current.length - 1]?.minPersonCount || "1",
      },
    ]);
  };

  const removeDistanceRule = (index: number) => {
    setDistanceRuleSuccess("");
    setDistanceRuleDrafts((current) =>
      current.filter((_, ruleIndex) => ruleIndex !== index),
    );
  };

  const handleDistanceRulesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDistanceRuleSuccess("");

    if (distanceRuleDrafts.length === 0) {
      setDistanceRuleError("En az bir mesafe kuralı eklemelisiniz.");
      return;
    }

    const rules = distanceRuleDrafts.map((rule) => ({
      distanceKm: Number(rule.distanceKm),
      minPersonCount: Number(rule.minPersonCount),
    }));

    const hasInvalidValue = rules.some(
      (rule) =>
        !Number.isInteger(rule.distanceKm) ||
        rule.distanceKm < 1 ||
        rule.distanceKm > 30 ||
        !Number.isInteger(rule.minPersonCount) ||
        rule.minPersonCount < 1,
    );
    if (hasInvalidValue) {
      setDistanceRuleError(
        "Bitiş mesafesi 1-30 km, minimum kişi sayısı en az 1 olmalıdır.",
      );
      return;
    }

    const hasInvalidOrder = rules.some(
      (rule, index) =>
        index > 0 &&
        (rule.distanceKm <= rules[index - 1].distanceKm ||
          rule.minPersonCount < rules[index - 1].minPersonCount),
    );
    if (hasInvalidOrder) {
      setDistanceRuleError(
        "Mesafe sınırları artmalı; mesafe arttıkça minimum kişi sayısı azalmamalıdır.",
      );
      return;
    }

    setDistanceRuleError("");
    distanceRuleMutation.mutate(rules);
  };

  const scrollToSection = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="space-y-8">
      {hasUnsavedChanges && (
        <div
          role="status"
          className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm font-semibold text-warning-800"
        >
          Kaydedilmemiş değişiklikler var. Turuncu noktalı bölümü kaydetmeden
          mağaza değiştirmeyin veya sayfadan ayrılmayın.
        </div>
      )}
      <nav
        aria-label="Mağaza ayarları bölümleri"
        className="sticky top-2 z-10 -mx-1 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur"
      >
        {settingsSections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-700"
          >
            <span className="inline-flex items-center gap-2">
              {section.label}
              {dirtySections[section.id] && (
                <span
                  className="h-2 w-2 rounded-full bg-warning-500"
                  aria-label="Kaydedilmemiş değişiklik var"
                />
              )}
            </span>
          </button>
        ))}
      </nav>
      <div id="store-profile" className="scroll-mt-20">
        <h2 className="text-lg font-semibold mb-4">Mağaza Bilgileri</h2>
        <form
          onSubmit={handleStoreSubmit}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          {storeFormError && (
            <div className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">
              <p>{storeFormError.message}</p>
              {Object.entries(storeFormError.fields).map(([field, message]) => (
                <p key={field} className="mt-1">
                  <strong>{field}:</strong> {message}
                </p>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mağaza Adı *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div />
            <div className="md:col-span-2 rounded-xl border border-info-200 bg-info-50 px-4 py-3 text-sm text-info-800">
              <p className="font-bold">Mağaza görünümü</p>
              <p className="mt-1 text-xs leading-5">
                Firma logosu ve müşteri sayfasındaki büyük kapak görseli, Vitrin sekmesinden yönetilir.
              </p>
              <Link
                to={`/seller/stores/${storeId}/showcase`}
                onClick={(event) => {
                  if (!confirmSellerStoreNavigation()) event.preventDefault();
                }}
                className="mt-2 inline-flex text-xs font-bold text-primary-700 hover:underline"
              >
                Mağaza görünümünü aç →
              </Link>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Kişi (Abonelik başına)
              </label>
              <input
                type="number"
                value={form.maxPersonCount}
                onChange={(e) =>
                  setForm({ ...form, maxPersonCount: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Günlük Toplam Kapasite (Kişi)
              </label>
              <input
                type="number"
                min={1}
                value={form.dailyCapacity}
                onChange={(e) =>
                  setForm({ ...form, dailyCapacity: e.target.value })
                }
                placeholder="Sınırsız"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Bir günde tüm aboneliklerin toplam kişi sayısı bu sınırı aşarsa yeni talepler
                kabul edilemez. Boş bırakılırsa günlük kapasite sınırlanmaz.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
              />
            </div>
            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-sm font-medium text-slate-700">
                İşletme / mutfak kategorileri
              </legend>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((value) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold ${form.categories.includes(value) ? "border-primary-300 bg-primary-50 text-primary-700" : "border-slate-200 text-slate-600"}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.categories.includes(value)}
                      onChange={() =>
                        setForm({
                          ...form,
                          categories: form.categories.includes(value)
                            ? form.categories.filter((item) => item !== value)
                            : [...form.categories, value],
                        })
                      }
                    />
                    {discoveryLabels[value]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teslimat Değişiklik Son Saati
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={form.changeCutoffHours}
                onChange={(e) =>
                  setForm({ ...form, changeCutoffHours: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Müşteri teslimattan en geç bu kadar saat önce gün atlayabilir
                veya dondurabilir.
              </p>
            </div>
          </div>
          <StoreAddressFields
            value={form}
            onChange={(address) =>
              setForm((current) => ({ ...current, ...address }))
            }
          />
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Kaydediliyor..." : "Güncelle"}
          </button>
        </form>
      </div>

      <div>
        <h2
          id="business-hours"
          className="scroll-mt-20 text-lg font-semibold mb-4"
        >
          Çalışma Saatleri
        </h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-3">
            {hours.map((h, i) => (
              <div key={h.dayOfWeek} className="flex flex-wrap items-center gap-3">
                <span className="w-24 text-sm font-medium">
                  {dayLabels[h.dayOfWeek]}
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={h.open}
                    onChange={(e) => {
                      if (!e.target.checked && h.open) {
                        setPendingDayClosure(h.dayOfWeek);
                        return;
                      }
                      const newHours = [...hours];
                      newHours[i] = { ...h, open: e.target.checked };
                      setHours(newHours);
                    }}
                    className="rounded text-primary-600"
                  />
                  <span className="text-sm">Açık</span>
                </label>
                {h.open ? (
                  <>
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => {
                        const newHours = [...hours];
                        newHours[i] = { ...h, openTime: e.target.value };
                        setHours(newHours);
                      }}
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => {
                        const newHours = [...hours];
                        newHours[i] = { ...h, closeTime: e.target.value };
                        setHours(newHours);
                      }}
                      className="px-2 py-1 border rounded text-sm"
                    />
                  </>
                ) : (
                  <span className="text-sm text-danger-500 font-medium">
                    Kapalı
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => hoursMutation.mutate(hours)}
            disabled={hoursMutation.isPending}
            className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            Saatleri Kaydet
          </button>
        </div>
      </div>

      <div>
        <h2
          id="delivery-slots"
          className="scroll-mt-20 text-lg font-semibold mb-4"
        >
          Teslimat Saatleri
        </h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Müşteriler abonelik oluştururken yalnızca burada tanımladığınız
            saatlerden birini seçebilir. Aboneliğin tüm hizmet günlerindeki
            çalışma saatlerine uygun seçenekler gösterilir.
          </p>
          {deliverySlotsLoading && <p role="status" className="mt-3 text-sm text-slate-600">Teslimat saatleri yükleniyor...</p>}
          {deliverySlotsLoadError && (
            <p role="alert" className="mt-3 text-sm text-danger-700">
              Kayıtlı teslimat saatleri yüklenemedi.
              <button type="button" onClick={() => reloadDeliverySlots()} className="ml-2 underline">Tekrar dene</button>
            </p>
          )}
          <fieldset disabled={deliverySlotsLoading || deliverySlotsLoadError || deliverySlotsMutation.isPending}>
          <DeliverySlotRangePicker
            value={deliverySlots}
            onChange={setDeliverySlots}
            onDirty={() => {
              setDeliverySlotError("");
              setDeliverySlotSuccess("");
            }}
          />
          {deliverySlotError && (
            <p role="alert" className="mt-3 text-sm text-danger-600">{deliverySlotError}</p>
          )}
          {deliverySlotSuccess && <p role="status" className="mt-3 text-sm text-success-700">{deliverySlotSuccess}</p>}
          <button
            type="button"
            onClick={() => deliverySlotsMutation.mutate(deliverySlots)}
            disabled={deliverySlots.length === 0 || deliverySlotsMutation.isPending}
            className="mt-5 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {deliverySlotsMutation.isPending
              ? "Kaydediliyor..."
              : "Teslimat saatlerini kaydet"}
          </button>
          </fieldset>
        </div>
      </div>

      <div>
        <h2
          id="service-areas"
          className="scroll-mt-20 text-lg font-semibold mb-4"
        >
          Teslimat ve hizmet bölgeleri
        </h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <LocationSelects
              value={areaForm}
              onChange={setAreaForm}
              includeNeighborhood={false}
            />
            <button
              onClick={() => areaForm.district && areaMutation.mutate(areaForm)}
              disabled={!areaForm.district || areaMutation.isPending}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              Ekle
            </button>
          </div>
          {serviceAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map((sa) => (
                <span
                  key={sa.id}
                  className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm"
                >
                  {sa.city} / {sa.district}
                  <button
                    onClick={() =>
                      setPendingDelete({ type: "area", id: sa.id })
                    }
                    aria-label={`${sa.city} ${sa.district} hizmet bölgesini sil`}
                    className="text-danger-600 hover:text-danger-700 ml-1"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Mesafe Kuralları</h2>
          <button
            type="button"
            onClick={addDistanceRule}
            disabled={distanceRuleDrafts.length >= 30}
            className="rounded-lg border border-primary-200 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
          >
            + Mesafe Kuralı
          </button>
        </div>
        <form
          onSubmit={handleDistanceRulesSubmit}
          className="rounded-xl bg-white p-6 shadow-sm"
        >
          <p className="mb-4 text-sm text-slate-500">
            Her satır, belirtilen mesafeye kadar geçerli minimum sipariş kişi
            sayısını tanımlar. Son bitiş mesafesi maksimum teslimat mesafesidir.
          </p>

          {distanceRuleError && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700"
            >
              {distanceRuleError}
            </p>
          )}
          {distanceRuleSuccess && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700"
            >
              {distanceRuleSuccess}
            </p>
          )}

          {distanceRulesLoading ? (
            <p className="text-sm text-slate-500">Kurallar yükleniyor...</p>
          ) : (
            <div className="space-y-3">
              {distanceRuleDrafts.map((rule, index) => (
                <div
                  key={rule.id ?? `new-${index}`}
                  className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Başlangıç (km)
                    </label>
                    <input
                      type="number"
                      value={
                        index === 0
                          ? 0
                          : distanceRuleDrafts[index - 1].distanceKm
                      }
                      readOnly
                      aria-label={`${index + 1}. kural başlangıç mesafesi`}
                      className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Bitiş (km)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="1"
                      required
                      value={rule.distanceKm}
                      onChange={(e) =>
                        updateDistanceRule(index, "distanceKm", e.target.value)
                      }
                      aria-label={`${index + 1}. kural bitiş mesafesi`}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Minimum kişi
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={rule.minPersonCount}
                      onChange={(e) =>
                        updateDistanceRule(
                          index,
                          "minPersonCount",
                          e.target.value,
                        )
                      }
                      aria-label={`${index + 1}. kural minimum kişi sayısı`}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDistanceRule(index)}
                    aria-label={`${index + 1}. mesafe kuralını sil`}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50"
                  >
                    Sil
                  </button>
                </div>
              ))}

              {distanceRuleDrafts.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                  Henüz mesafe kuralı yok. “Mesafe Kuralı” ile ekleyebilirsiniz.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={
              distanceRulesLoading ||
              distanceRuleDrafts.length === 0 ||
              distanceRuleMutation.isPending
            }
            className="mt-4 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {distanceRuleMutation.isPending
              ? "Kaydediliyor..."
              : "Mesafe Kurallarını Kaydet"}
          </button>
        </form>
      </div>

      <div>
        <h2
          id="closed-days"
          className="scroll-mt-20 text-lg font-semibold mb-4"
        >
          Kapalı Günler
        </h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4 flex w-fit rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setClosedDateMode("single");
                setClosedDateForm((current) => ({ ...current, endDate: "" }));
                setClosedDateError("");
                setClosedDateSuccess("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${closedDateMode === "single" ? "bg-white shadow-sm" : "text-slate-500"}`}
            >
              Tek gün
            </button>
            <button
              type="button"
              onClick={() => {
                setClosedDateMode("range");
                setClosedDateError("");
                setClosedDateSuccess("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-bold ${closedDateMode === "range" ? "bg-white shadow-sm" : "text-slate-500"}`}
            >
              Tarih aralığı
            </button>
          </div>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="text-xs font-bold text-slate-600 sm:w-36">
              {closedDateMode === "range" ? "Başlangıç" : "Kapalı gün"}
            <input
              type="date"
              aria-label="Kapalı gün tarihi"
              min={earliestClosedDate}
              value={closedDateForm.closedDate}
              onChange={(e) =>
                setClosedDateForm({
                  ...closedDateForm,
                  closedDate: e.target.value,
                })
              }
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm"
            />
            </label>
            {closedDateMode === "range" && (
              <label className="text-xs font-bold text-slate-600 sm:w-36">
                Bitiş
                <input
                  type="date"
                  aria-label="Kapalı gün bitiş tarihi"
                  min={closedDateForm.closedDate || earliestClosedDate}
                  value={closedDateForm.endDate}
                  onChange={(event) =>
                    setClosedDateForm({
                      ...closedDateForm,
                      endDate: event.target.value,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm"
                />
              </label>
            )}
            <label className="text-xs font-bold text-slate-600 sm:min-w-0 sm:flex-1">
              Sebep
            <input
              type="text"
              aria-label="Kapalı gün sebebi"
              value={closedDateForm.reason}
              onChange={(e) =>
                setClosedDateForm({ ...closedDateForm, reason: e.target.value })
              }
              placeholder="Sebep (opsiyonel)"
              className="mt-1 block w-full px-3 py-2 border rounded-lg text-sm"
            />
            </label>
            <button
              onClick={() =>
                closedDateForm.closedDate && addClosedDateMutation.mutate()
              }
              disabled={
                !closedDateForm.closedDate ||
                (closedDateMode === "range" &&
                  (!closedDateForm.endDate ||
                    closedDateForm.endDate < closedDateForm.closedDate)) ||
                closedDateForm.closedDate < earliestClosedDate ||
                addClosedDateMutation.isPending
              }
              className="w-full shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 sm:w-auto"
            >
              {closedDateMode === "range" ? "Aralığı ekle" : "Ekle"}
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Kapalı gün en erken {earliestClosedDate} için tanımlanabilir (en az
            2 gün önceden).
          </p>
          {closedDateError && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700"
            >
              {closedDateError}
            </p>
          )}
          {closedDateSuccess && (
            <p role="status" className="mb-4 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700">
              {closedDateSuccess}
            </p>
          )}
          {closedDates.length > 0 && (
            <div className="space-y-2">
              {closedDates.map((cd) => (
                <div
                  key={cd.id}
                  className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg"
                >
                  <div className="text-sm">
                    <span className="font-medium">{cd.closedDate}</span>
                    {cd.reason && (
                      <span className="text-slate-500 ml-2">— {cd.reason}</span>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setPendingDelete({ type: "closedDate", id: cd.id })
                    }
                    className="text-danger-500 text-sm hover:text-danger-700"
                    aria-label={`${cd.closedDate} kapalı gününü sil`}
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2
          id="store-status"
          className="scroll-mt-20 text-lg font-semibold mb-4"
        >
          Mağaza Durumu
        </h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
            <span>Mevcut durum:</span>
            <StatusBadge domain="store" status={store?.status || "DRAFT"} />
          </div>
          <div className="flex gap-2">
            {(store?.status === "DRAFT" || store?.status === "SUSPENDED") && (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="bg-success-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-success-700 disabled:opacity-50"
              >
                Mağazayı Yayına Al
              </button>
            )}
            {store?.status === "ACTIVE" && (
              <button
                onClick={() => suspendMutation.mutate()}
                disabled={suspendMutation.isPending}
                className="bg-warning-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-warning-700 disabled:opacity-50"
              >
                Askıya Al
              </button>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        open={!!pendingDayClosure}
        title="Çalışma günü değişikliğini onayla"
        message={`${pendingDayClosure ? dayLabels[pendingDayClosure] : "Seçilen"} günü kapalı olarak işaretlenecek. Saatleri kaydettiğinizde yeni aboneler güncel çalışma günleriyle hemen oluşturulabilir. Mevcut abonelikler bu hafta ve sonraki hafta mevcut teslimat planıyla devam eder; ${serviceDayChangeEffectiveDate()} tarihinden itibaren güncel servis günleri uygulanır. Etkilenen müşterilere bildirim gönderilecektir.`}
        confirmLabel="Kapalı olarak işaretle"
        danger
        onClose={() => setPendingDayClosure(undefined)}
        onConfirm={confirmDayClosure}
      />
      <ConfirmModal
        open={!!pendingDelete}
        title="Kaydı sil"
        message="Seçtiğiniz kayıt silinecek. Devam etmek istiyor musunuz?"
        confirmLabel="Sil"
        danger
        pending={
          deleteAreaMutation.isPending || deleteClosedDateMutation.isPending
        }
        onClose={() => setPendingDelete(undefined)}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.type === "area")
            deleteAreaMutation.mutate(pendingDelete.id, {
              onSuccess: () => setPendingDelete(undefined),
            });
          else
            deleteClosedDateMutation.mutate(pendingDelete.id, {
              onSuccess: () => setPendingDelete(undefined),
            });
        }}
      />
    </div>
  );
}
