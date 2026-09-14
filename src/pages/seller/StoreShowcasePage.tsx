import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import { Link, useOutletContext } from "react-router-dom";
import { Image as ImageIcon, Store as StoreIcon, Upload } from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal";
import { discoveryLabels } from "@/constants/discovery";
import type { Menu, MenuItem, Store } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { parseApiError } from "@/utils/apiErrors";
import { subscribeToSellerStoreNavigation } from "@/utils/sellerStoreNavigation";

const dietOptions = [
  "VEGAN",
  "VEJETARYEN",
  "PESKETARYEN",
  "GLUTENSIZ",
  "LAKTOZSUZ",
  "DUSUK_KALORI",
  "YUKSEK_PROTEIN",
  "DUSUK_KARBONHIDRAT",
  "KETOJENIK",
  "PALEO",
  "SEKERSIZ",
  "TUZSUZ",
  "DIYABETE_UYGUN",
  "HELAL",
  "ORGANIK",
];
const allergenOptions = [
  "GLUTEN",
  "SUT",
  "YUMURTA",
  "YER_FISTIGI",
  "SERT_KABUKLU",
  "SOYA",
  "BALIK",
  "KABUKLU_DENIZ_URUNU",
  "YUMUSAKCA",
  "SUSAM",
  "KEREVIZ",
  "HARDAL",
  "ACI_BAKLA",
  "KUKURT_DIOKSIT_VE_SULFITLER",
];

const mealSuggestions = [
  { name: "Mercimek Çorbası", category: "Çorba" },
  { name: "Tarhana Çorbası", category: "Çorba" },
  { name: "Yayla Çorbası", category: "Çorba" },
  { name: "Ezogelin Çorbası", category: "Çorba" },
  { name: "Sulu Köfte", category: "Ana yemek" },
  { name: "Kuru Fasulye", category: "Ana yemek" },
  { name: "Patlıcan Musakka", category: "Ana yemek" },
  { name: "Nohut", category: "Ana yemek" },
  { name: "Taze Fasulye", category: "Ana yemek" },
  { name: "Pirinç Pilavı", category: "Yardımcı yemek" },
  { name: "Bulgur Pilavı", category: "Yardımcı yemek" },
];

type MenuForm = {
  name: string;
  description: string;
  pricePerPerson: string;
  priceEffectiveFrom: string;
  availableFrom: string;
  availableUntil: string;
  allergenInfo: string;
  dietTags: string[];
  allergens: string[];
};

type MenuItemForm = Pick<MenuItem, "name" | "description" | "imageUrl"> & {
  id?: number;
};

const menuPhotos = (menu: Menu) =>
  menu.galleryImages?.length
    ? menu.galleryImages
    : menu.imageUrl
      ? [{ id: 0, imageUrl: menu.imageUrl, sortOrder: 0 }]
      : [];

const deleteErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } })
      .response;
    if (typeof response?.data?.message === "string")
      return response.data.message;
  }
  return "Menü silinemedi. Lütfen tekrar deneyin.";
};

export default function StoreShowcasePage() {
  const { storeId, store } = useOutletContext<{ storeId: number; store?: Store }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuForm>({
    name: "",
    description: "",
    pricePerPerson: "",
    priceEffectiveFrom: "",
    availableFrom: "",
    availableUntil: "",
    allergenInfo: "",
    dietTags: [],
    allergens: [],
  });
  const [items, setItems] = useState<MenuItemForm[]>([
    { name: "", description: "" },
  ]);
  const [stagedGalleryFiles, setStagedGalleryFiles] = useState<File[]>([]);
  const [deleteMenuId, setDeleteMenuId] = useState<number | null>(null);
  const [menuToDeactivate, setMenuToDeactivate] = useState<number | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<number[]>([]);
  const [formDirty, setFormDirty] = useState(false);
  const [timelineMenuId, setTimelineMenuId] = useState<number | null>(null);
  const [visualError, setVisualError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuStatusFilter, setMenuStatusFilter] = useState<"ALL" | "ACTIVE" | "PASSIVE">("ALL");
  const previousStoreId = useRef(storeId);

  const menusQuery = useQuery({
    queryKey: ["seller-menus", storeId],
    queryFn: () => sellerService.getMenusForStore(storeId),
    enabled: !!storeId,
  });
  const menus = menusQuery.data ?? [];
  const { data: menuVersions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ["menu-versions", timelineMenuId],
    queryFn: () => sellerService.getMenuVersions(timelineMenuId!),
    enabled: timelineMenuId !== null,
  });
  const businessHoursQuery = useQuery({
    queryKey: ["seller-business-hours", storeId],
    queryFn: () => sellerService.getBusinessHours(storeId),
    enabled: !!storeId,
  });
  const editingMenu = editingId
    ? menus.find((menu) => menu.id === editingId)
      : undefined;
  const reportAction = (message: string, tone: "success" | "error" = "success") =>
    setActionFeedback({ tone, message });
  const editingPhotos = editingMenu ? menuPhotos(editingMenu) : [];
  const setupSteps = [
    {
      label: "Firma logosu",
      complete: Boolean(store?.logoUrl),
      to: "#store-visuals",
    },
    {
      label: "Kapak görseli",
      complete: Boolean(store?.coverImageUrl),
      to: "#store-visuals",
    },
    {
      label: "Aktif menü",
      complete: menus.some((menu) => menu.active),
      to: "#menus",
    },
    {
      label: "Yemek çeşitleri",
      complete: menus.some((menu) => menu.items.length > 0),
      to: "#menus",
    },
    {
      label: "Çalışma saatleri",
      complete: businessHoursQuery.data?.some((hour) => hour.open) ?? false,
      to: `/seller/stores/${storeId}/settings#business-hours`,
      unavailable: businessHoursQuery.isError,
    },
  ];
  const completedSetupSteps = setupSteps.filter((step) => step.complete).length;
  const normalizedMenuSearch = menuSearch.trim().toLocaleLowerCase("tr-TR");
  const filteredMenus = menus.filter((menu) => {
    const matchesStatus =
      menuStatusFilter === "ALL" ||
      (menuStatusFilter === "ACTIVE" ? menu.active : !menu.active);
    const matchesSearch =
      !normalizedMenuSearch ||
      menu.name.toLocaleLowerCase("tr-TR").includes(normalizedMenuSearch) ||
      menu.items.some((item) =>
        item.name.toLocaleLowerCase("tr-TR").includes(normalizedMenuSearch),
      );
    return matchesStatus && matchesSearch;
  });

  const addStagedGalleryFiles = (files: File[]) => {
    const availableSlots = Math.max(
      0,
      10 - editingPhotos.length - stagedGalleryFiles.length,
    );
    if (availableSlots === 0) {
      window.alert("Bu menü için 10 fotoğraf sınırına ulaştınız.");
      return;
    }
    if (files.length > availableSlots) {
      window.alert(
        `Bu menüye en fazla 10 fotoğraf ekleyebilirsiniz. ${availableSlots} fotoğraf daha seçebilirsiniz.`,
      );
    }
    setStagedGalleryFiles((current) => [
      ...current,
      ...files.slice(0, availableSlots),
    ]);
    setFormDirty(true);
  };

  const createMutation = useMutation({
    mutationFn: (
      data: Parameters<typeof sellerService.createMenuForStore>[1],
    ) => sellerService.createMenuForStore(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menus", storeId] });
    },
    onError: (error) =>
      setSaveError(parseApiError(error, "Menü oluşturulamadı.").message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof sellerService.updateMenu>[1];
    }) => sellerService.updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menus", storeId] });
    },
    onError: (error) =>
      setSaveError(parseApiError(error, "Menü güncellenemedi.").message),
  });

  const toggleMutation = useMutation({
    mutationFn: sellerService.toggleMenuActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menus", storeId] });
      reportAction("Menü durumu güncellendi.");
    },
    onError: (error) =>
      reportAction(parseApiError(error, "Menü durumu güncellenemedi.").message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: sellerService.deleteMenu,
    onSuccess: () => {
      setDeleteMenuId(null);
      queryClient.invalidateQueries({ queryKey: ["seller-menus", storeId] });
      reportAction("Menü silindi.");
    },
    onError: (error) => {
      setDeleteMenuId(null);
      reportAction(deleteErrorMessage(error), "error");
    },
  });
  const copyMutation = useMutation({
    mutationFn: sellerService.copyMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menus", storeId] });
      reportAction("Menü taslak kopyası oluşturuldu.");
    },
    onError: (error) =>
      reportAction(parseApiError(error, "Menü kopyalanamadı.").message, "error"),
  });
  const bulkMutation = useMutation({
    mutationFn: ({ active }: { active: boolean }) =>
      sellerService.setMenusActive(selectedMenus, active),
    onSuccess: () => {
      setSelectedMenus([]);
      queryClient.invalidateQueries({ queryKey: ["seller-menus", storeId] });
      reportAction("Seçili menülerin durumu güncellendi.");
    },
    onError: (error) =>
      reportAction(parseApiError(error, "Seçili menüler güncellenemedi.").message, "error"),
  });

  const galleryMutation = useMutation({
    mutationFn: ({ menuId, files }: { menuId: number; files: File[] }) =>
      sellerService.uploadMenuGallery(menuId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menus", storeId] });
      reportAction("Menü fotoğrafları yüklendi.");
    },
    onError: (error) =>
      reportAction(parseApiError(error, "Menü fotoğrafları yüklenemedi.").message, "error"),
  });
  const deleteGalleryMutation = useMutation({
    mutationFn: ({ menuId, imageId }: { menuId: number; imageId: number }) =>
      sellerService.deleteMenuGalleryImage(menuId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menus", storeId] });
      reportAction("Menü fotoğrafı silindi.");
    },
    onError: (error) =>
      reportAction(parseApiError(error, "Menü fotoğrafı silinemedi.").message, "error"),
  });
  const coverMutation = useMutation({
    mutationFn: ({ menuId, imageId }: { menuId: number; imageId: number }) =>
      sellerService.setMenuGalleryCover(menuId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menus", storeId] });
      reportAction("Vitrin kapak fotoğrafı güncellendi.");
    },
    onError: (error) =>
      reportAction(parseApiError(error, "Kapak fotoğrafı güncellenemedi.").message, "error"),
  });
  const storeImageMutation = useMutation({
    mutationFn: ({ type, file }: { type: "logo" | "cover"; file: File }) =>
      sellerService.uploadStoreImage(storeId, type, file),
    onSuccess: () => {
      setVisualError("");
      queryClient.invalidateQueries({
        queryKey: ["seller-store", String(storeId)],
      });
      queryClient.invalidateQueries({ queryKey: ["seller-stores"] });
    },
    onError: (error) =>
      setVisualError(
        parseApiError(
          error,
          "Görsel yüklenemedi. JPG, PNG veya WEBP biçiminde, en fazla 5 MB olan başka bir dosya deneyin.",
        ).message,
      ),
  });
  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      pricePerPerson: "",
      priceEffectiveFrom: "",
      availableFrom: "",
      availableUntil: "",
      allergenInfo: "",
      dietTags: [],
      allergens: [],
    });
    setItems([{ name: "", description: "" }]);
    setStagedGalleryFiles([]);
    setFormDirty(false);
  };
  const discardForm = () => {
    if (
      formDirty &&
      !window.confirm(
        "Kaydedilmemiş menü değişiklikleri var. Formu kapatmak istiyor musunuz?",
      )
    )
      return;
    resetForm();
  };

  const startEdit = (menu: Menu) => {
    setEditingId(menu.id);
    setForm({
      name: menu.name,
      description: menu.description || "",
      pricePerPerson: String(menu.pricePerPerson),
      priceEffectiveFrom: "",
      availableFrom: menu.availableFrom || "",
      availableUntil: menu.availableUntil || "",
      allergenInfo: menu.allergenInfo || "",
      dietTags: menu.dietTags || [],
      allergens: menu.allergens || [],
    });
    setItems(
      menu.items.length
        ? menu.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description || "",
            imageUrl: item.imageUrl,
          }))
        : [{ name: "", description: "" }],
    );
    setStagedGalleryFiles([]);
    setFormDirty(false);
    setShowForm(true);
  };

  useEffect(() => {
    if (!showForm || !formDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [showForm, formDirty]);

  useEffect(
    () =>
      subscribeToSellerStoreNavigation((event) => {
        if (
          showForm &&
          formDirty &&
          !window.confirm(
            "Kaydedilmemiş menü değişiklikleri var. Geçiş yaparsanız bu değişiklikler kaybolacak. Devam etmek istiyor musunuz?",
          )
        ) {
          event.preventDefault();
        }
      }),
    [showForm, formDirty],
  );

  useEffect(() => {
    if (previousStoreId.current === storeId) return;
    previousStoreId.current = storeId;
    resetForm();
    setSelectedMenus([]);
    setTimelineMenuId(null);
    setSaveError("");
    setVisualError("");
  }, [storeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    if (
      form.availableFrom &&
      form.availableUntil &&
      form.availableUntil < form.availableFrom
    ) {
      setSaveError("Menü bitiş tarihi başlangıç tarihinden önce olamaz.");
      return;
    }
    const data = {
      name: form.name,
      description: form.description || undefined,
      pricePerPerson: Number(form.pricePerPerson),
      priceEffectiveFrom: form.priceEffectiveFrom || undefined,
      availableFrom: form.availableFrom || undefined,
      availableUntil: form.availableUntil || undefined,
      allergenInfo: form.allergenInfo || undefined,
      dietTags: form.dietTags,
      allergens: form.allergens,
      items: items
        .filter((i) => i.name)
        .map((i, idx) => ({ ...i, sortOrder: idx })),
    };
    const completeMenuSave = (updatedMenu: Menu) => {
      if (stagedGalleryFiles.length === 0) {
        resetForm();
        return;
      }
      galleryMutation.mutate(
        { menuId: updatedMenu.id, files: stagedGalleryFiles },
        {
          onSuccess: () => resetForm(),
          onError: (error) =>
            setSaveError(
              parseApiError(
                error,
                "Menü kaydedildi fakat seçilen fotoğraflar yüklenemedi. Fotoğrafları tekrar seçip yeniden deneyin.",
              ).message,
            ),
        },
      );
    };
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data },
        {
          onSuccess: completeMenuSave,
        },
      );
    } else createMutation.mutate(data, { onSuccess: completeMenuSave });
  };

  const addItem = () => {
    setItems([...items, { name: "", description: "" }]);
    setFormDirty(true);
  };
  const addSuggestedItem = (name: string, category: string) => {
    if (items.some((item) => item.name.trim().toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"))) return;
    const firstBlankIndex = items.findIndex((item) => !item.name.trim());
    if (firstBlankIndex >= 0) {
      setItems(items.map((item, index) => index === firstBlankIndex ? { name, description: category } : item));
      setFormDirty(true);
      return;
    }
    setItems([...items, { name, description: category }]);
    setFormDirty(true);
  };
  const removeItem = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i));
    setFormDirty(true);
  };
  const updateItem = (i: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], [field]: value };
    setItems(newItems);
    setFormDirty(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Mağaza vitrini"
        title="Menüler ve vitrin"
        description="Mağaza görünümünüzü, menülerinizi ve müşteri vitrininizi buradan yönetin."
      />

      {actionFeedback && (
        <div
          role={actionFeedback.tone === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
            actionFeedback.tone === "error"
              ? "border-danger-200 bg-danger-50 text-danger-700"
              : "border-success-200 bg-success-50 text-success-700"
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            aria-label="İşlem bildirimini kapat"
            className="rounded px-1 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      <section id="store-visuals" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-black text-slate-900">Mağaza görünümü</h2>
          <p className="mt-1 text-sm text-slate-600">
            Logo küçük karede, kapak görseli ise müşteri mağaza sayfasındaki büyük üst alanda görünür.
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            JPG, PNG veya WEBP · En fazla 5 MB
          </p>
        </div>
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {store?.logoUrl ? (
                  <img src={store.logoUrl} alt={`${store.name} logosu`} className="h-full w-full object-contain" />
                ) : (
                  <StoreIcon className="h-9 w-9 text-primary-500" aria-hidden="true" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Firma logosu</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Kare logo kullanın; müşteri sayfasında mağaza adının yanında gösterilir.
                  Önerilen ölçü: en az 800 × 800 px.
                </p>
              </div>
            </div>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-primary-300 hover:text-primary-700">
              <Upload className="h-4 w-4" aria-hidden="true" />
              {storeImageMutation.isPending ? "Yükleniyor..." : "Logo yükle"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={storeImageMutation.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) storeImageMutation.mutate({ type: "logo", file });
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-warning-100 via-cream to-success-100">
              <div className="grid h-28 place-items-center sm:h-32">
                {store?.coverImageUrl ? (
                  <img src={store.coverImageUrl} alt={`${store.name} kapak görseli`} className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center text-accent-700">
                    <ImageIcon className="mx-auto h-8 w-8" aria-hidden="true" />
                    <p className="mt-1 text-xs font-bold">Kapak görseli henüz eklenmedi</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">Mağaza kapak görseli</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Yemek servisinizin veya özenli bir sofra sunumunuzun yatay fotoğrafını kullanın.
                  Önerilen oran 3:1, ölçü en az 1600 × 600 px.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-primary-700">
                <Upload className="h-4 w-4" aria-hidden="true" />
                {storeImageMutation.isPending ? "Yükleniyor..." : "Kapak görseli yükle"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={storeImageMutation.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) storeImageMutation.mutate({ type: "cover", file });
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        {visualError && (
          <p className="mx-5 mb-5 rounded-lg bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 sm:mx-6 sm:mb-6">
            {visualError}
          </p>
        )}
        <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[.14em] text-slate-500">
            Müşteride önizleme
          </p>
          <div className="mt-3 max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-28 bg-gradient-to-br from-warning-100 via-cream to-success-100 sm:h-32">
              {store?.coverImageUrl && (
                <img src={store.coverImageUrl} alt="" className="h-full w-full object-contain" />
              )}
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="-mt-10 grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm">
                {store?.logoUrl ? (
                  <img src={store.logoUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <StoreIcon className="h-7 w-7 text-primary-500" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-ink">{store?.name || "Mağazanız"}</p>
                <p className="mt-1 text-xs text-slate-500">Mağaza adı ve görselleri müşteriye bu düzende görünür.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-ink">Mağaza kurulum özeti</h2>
            <p className="mt-1 text-sm text-slate-600">
              Müşteriye daha eksiksiz bir vitrin sunmak için bilgilerinizi tamamlayın.
            </p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-black text-primary-700">
            {completedSetupSteps} / {setupSteps.length} tamamlandı
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {setupSteps.map((step) => {
            const content = (
              <>
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs font-black ${
                    step.complete
                      ? "bg-success-100 text-success-700"
                      : step.unavailable
                        ? "bg-warning-100 text-warning-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step.complete ? "✓" : step.unavailable ? "!" : "○"}
                </span>
                <span>{step.label}</span>
              </>
            );
            return step.to.startsWith("#") ? (
              <a
                key={step.label}
                href={step.to}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              >
                {content}
              </a>
            ) : (
              <Link
                key={step.label}
                to={step.to}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              >
                {content}
              </Link>
            );
          })}
        </div>
        {businessHoursQuery.isError && (
          <p role="alert" className="mt-3 text-xs font-semibold text-warning-700">
            Çalışma saatleri kontrol edilemedi; mağaza ayarlarından tekrar deneyin.
          </p>
        )}
      </section>

      <div id="menus" className="flex justify-end">
        <Button
          onClick={() => {
            if (showForm) discardForm();
            else setShowForm(true);
          }}
        >
          {showForm ? "İptal" : "+ Yeni menü"}
        </Button>
      </div>

      {showForm && (
        <form
          onChange={() => setFormDirty(true)}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Menü Adı *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kişi Başı Fiyat (₺) *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.pricePerPerson}
                onChange={(e) =>
                  setForm({ ...form, pricePerPerson: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
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
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fiyat geçerlilik tarihi
              </label>
              <input
                type="date"
                value={form.priceEffectiveFrom}
                onChange={(e) =>
                  setForm({ ...form, priceEffectiveFrom: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <fieldset className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 md:grid-cols-2">
              <legend className="px-1 text-sm font-bold text-slate-700">
                Menünün sunulacağı tarih aralığı
              </legend>
              <label className="block text-sm font-medium text-slate-700">
                Başlangıç tarihi
                <input
                  type="date"
                  aria-label="Menü sunum başlangıç tarihi"
                  value={form.availableFrom}
                  onChange={(event) =>
                    setForm({ ...form, availableFrom: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Bitiş tarihi
                <input
                  type="date"
                  aria-label="Menü sunum bitiş tarihi"
                  value={form.availableUntil}
                  onChange={(event) =>
                    setForm({ ...form, availableUntil: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
              <p className="text-xs leading-5 text-slate-500 md:col-span-2">
                Boş bırakırsanız menü süresiz sunulur. Tarih aralığı dışındaki
                abonelikler bu menüyü kullanamaz.
              </p>
            </fieldset>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Alerjen Bilgisi
              </label>
              <textarea
                value={form.allergenInfo}
                onChange={(e) =>
                  setForm({ ...form, allergenInfo: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={2}
                placeholder="Örn. Gluten, süt ürünü ve fındık içerir."
              />
            </div>
            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Diyet etiketleri
              </legend>
              <div className="flex flex-wrap gap-2">
                {dietOptions.map((value) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold ${form.dietTags.includes(value) ? "border-success-300 bg-success-50 text-success-700" : "border-slate-200 text-slate-600"}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.dietTags.includes(value)}
                      onChange={() =>
                        setForm({
                          ...form,
                          dietTags: form.dietTags.includes(value)
                            ? form.dietTags.filter((item) => item !== value)
                            : [...form.dietTags, value],
                        })
                      }
                    />
                    {discoveryLabels[value]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="md:col-span-2">
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Yapılandırılmış alerjenler
              </legend>
              <div className="flex flex-wrap gap-2">
                {allergenOptions.map((value) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold ${form.allergens.includes(value) ? "border-warning-300 bg-warning-50 text-warning-700" : "border-slate-200 text-slate-600"}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.allergens.includes(value)}
                      onChange={() =>
                        setForm({
                          ...form,
                          allergens: form.allergens.includes(value)
                            ? form.allergens.filter((item) => item !== value)
                            : [...form.allergens, value],
                        })
                      }
                    />
                    {discoveryLabels[value]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {editingId && (
            <section
              className="mb-4 rounded-xl border border-dashed border-info-200 bg-info-50/50 p-4"
              aria-label="Menü fotoğrafları"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  Menü fotoğrafları
                </h3>
                <p className="text-xs font-medium text-slate-600">
                  {editingPhotos.length + stagedGalleryFiles.length} / 10
                  fotoğraf
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Yüklü fotoğraflar aşağıda görünür. Yeni seçimler yalnız{" "}
                <b>Güncelle</b> seçeneğine bastığınızda kaydedilir.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {editingPhotos.map((image, index) => (
                  <div
                    key={image.id || image.imageUrl}
                    className="relative h-20 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <img
                      src={image.imageUrl}
                      alt={`${editingMenu?.name || "Menü"} fotoğraf ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    {image.imageUrl === editingMenu?.imageUrl && (
                      <span className="absolute bottom-1 left-1 rounded bg-slate-950/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Vitrin
                      </span>
                    )}
                  </div>
                ))}
                {stagedGalleryFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="relative flex h-20 w-24 items-center justify-center rounded-xl border border-dashed border-info-300 bg-white p-2 text-center text-[11px] font-medium text-info-700"
                  >
                    <span className="line-clamp-3 break-all">{file.name}</span>
                    <button
                      type="button"
                      aria-label={`${file.name} seçimini kaldır`}
                      onClick={() =>
                        setStagedGalleryFiles((current) =>
                          current.filter((item) => item !== file),
                        )
                      }
                      className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-danger-600 text-xs font-bold text-white"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-info-600 px-1 py-0.5 text-[9px] font-bold text-white">
                      Yeni
                    </span>
                  </div>
                ))}
                {editingPhotos.length + stagedGalleryFiles.length < 10 && (
                  <label className="flex h-20 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary-300 bg-white text-primary-600 transition hover:border-primary-500 hover:bg-primary-50">
                    <span
                      aria-hidden="true"
                      className="text-3xl font-light leading-none"
                    >
                      +
                    </span>
                    <span className="mt-1 text-[11px] font-bold">
                      Fotoğraf ekle
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="sr-only"
                      disabled={
                        updateMutation.isPending || galleryMutation.isPending
                      }
                      onChange={(event) => {
                        addStagedGalleryFiles(
                          Array.from(event.target.files || []),
                        );
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-600">
                JPG, PNG veya WEBP kabul edilir. Her fotoğraf en fazla 5 MB;
                menü başına en fazla <b>10 fotoğraf</b> ekleyebilirsiniz.
              </p>
              {stagedGalleryFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStagedGalleryFiles([])}
                  className="mt-2 text-xs font-bold text-danger-600 hover:underline"
                >
                  Yeni fotoğraf seçimlerini temizle
                </button>
              )}
            </section>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Sunulan yemek çeşitleri
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  Günlük menü sözü vermeden, mutfağınızda genel olarak yer alan seçenekleri belirtin.
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-primary-600 hover:underline"
              >
                + Ekle
              </button>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {mealSuggestions.map((suggestion) => (
                <button
                  key={suggestion.name}
                  type="button"
                  onClick={() => addSuggestedItem(suggestion.name, suggestion.category)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                >
                  + {suggestion.name}
                </button>
              ))}
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                  placeholder="Yemek adı"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                  placeholder="Kategori (örn. Çorba)"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-danger-500 text-sm px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              galleryMutation.isPending
            }
            className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {createMutation.isPending ||
            updateMutation.isPending ||
            galleryMutation.isPending
              ? "Kaydediliyor..."
              : editingId
                ? "Güncelle"
                : "Menü Oluştur"}
          </button>
          {saveError && (
            <p role="alert" className="mt-3 text-sm font-semibold text-danger-600">
              {saveError}
            </p>
          )}
        </form>
      )}

      <div>
      {menusQuery.isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : menusQuery.isError ? (
        <EmptyState
          title="Menüler yüklenemedi"
          description="Bağlantıyı kontrol edip tekrar deneyin."
          action={<Button variant="outline" onClick={() => menusQuery.refetch()}>Tekrar dene</Button>}
        />
      ) : menus.length === 0 ? (
        <EmptyState
          title="Henüz menü oluşturulmamış"
          description="İlk menünüzü oluşturarak mağaza vitrininizi müşterilere açın."
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-center">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Menü veya yemek çeşidi ara</span>
              <input
                type="search"
                value={menuSearch}
                onChange={(event) => {
                  setMenuSearch(event.target.value);
                  setSelectedMenus([]);
                }}
                placeholder="Menü veya yemek çeşidi ara"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
              />
            </label>
            <label>
              <span className="sr-only">Menü durumu</span>
              <select
                value={menuStatusFilter}
                onChange={(event) => {
                  setMenuStatusFilter(event.target.value as "ALL" | "ACTIVE" | "PASSIVE");
                  setSelectedMenus([]);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
              >
                <option value="ALL">Tüm menüler</option>
                <option value="ACTIVE">Aktif menüler</option>
                <option value="PASSIVE">Pasif menüler</option>
              </select>
            </label>
          </div>
          {selectedMenus.length > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm">
              <b>{selectedMenus.length} menü seçildi</b>
              <button
                onClick={() => bulkMutation.mutate({ active: true })}
                className="rounded bg-success-600 px-3 py-1.5 font-bold text-white"
              >
                Toplu aktif et
              </button>
              <button
                onClick={() => bulkMutation.mutate({ active: false })}
                className="rounded bg-warning-600 px-3 py-1.5 font-bold text-white"
              >
                Toplu pasif et
              </button>
            </div>
          )}
          <div className="space-y-4">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 gap-4">
                    <input
                      type="checkbox"
                      checked={selectedMenus.includes(menu.id)}
                      aria-label={`${menu.name} menüsünü toplu işlem için seç`}
                      onChange={() =>
                        setSelectedMenus((ids) =>
                          ids.includes(menu.id)
                            ? ids.filter((id) => id !== menu.id)
                            : [...ids, menu.id],
                        )
                      }
                      className="mt-1"
                    />
                    {menu.imageUrl && (
                      <div className="relative h-24 w-28 shrink-0">
                        <img
                          src={menu.imageUrl}
                          alt={`${menu.name} vitrin fotoğrafı`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full rounded-xl object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-slate-950/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          Vitrin fotoğrafı
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-ink">{menu.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${menu.active ? "bg-success-100 text-success-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {menu.active ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                      {menu.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {menu.description}
                        </p>
                      )}
                      {(menu.availableFrom || menu.availableUntil) && (
                        <p className="mt-2 text-xs font-semibold text-info-700">
                          Sunum dönemi: {menu.availableFrom || "Başlangıç sınırı yok"}
                          {" — "}
                          {menu.availableUntil || "Bitiş sınırı yok"}
                        </p>
                      )}
                      {menuPhotos(menu).length > 0 && (
                        <div
                          className="mt-3 flex flex-wrap gap-2"
                          aria-label="Menü fotoğrafları"
                        >
                          {menuPhotos(menu).map((image, index) => (
                            <label
                              key={image.id || image.imageUrl}
                              className="group relative block cursor-pointer"
                            >
                              <img
                                src={image.imageUrl}
                                alt={`${menu.name} fotoğraf ${index + 1}`}
                                loading="lazy"
                                decoding="async"
                                className="h-16 w-20 rounded-lg object-cover"
                              />
                              {image.id > 0 && (
                                <span className="absolute left-1 top-1 rounded bg-white/90 p-1">
                                  <input
                                    type="checkbox"
                                    aria-label={`${menu.name} vitrin fotoğrafı seçimi`}
                                    checked={image.imageUrl === menu.imageUrl}
                                    disabled={coverMutation.isPending}
                                    onChange={(event) => {
                                      if (event.target.checked)
                                        coverMutation.mutate({
                                          menuId: menu.id,
                                          imageId: image.id,
                                        });
                                    }}
                                    className="h-3.5 w-3.5 accent-primary-600"
                                  />
                                </span>
                              )}
                              {image.id > 0 && (
                                <button
                                  type="button"
                                  aria-label="Menü fotoğrafını sil"
                                  disabled={deleteGalleryMutation.isPending}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    deleteGalleryMutation.mutate({
                                      menuId: menu.id,
                                      imageId: image.id,
                                    });
                                  }}
                                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-danger-600 text-xs font-bold text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 disabled:opacity-50"
                                >
                                  ×
                                </button>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                      {menu.items.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {menu.items.map((item) => (
                            <span
                              key={item.id}
                              className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
                            >
                              {item.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-right text-lg font-bold text-primary-600">
                      {menu.pricePerPerson.toLocaleString("tr-TR")} ₺
                      <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                        kişi / gün
                      </span>
                    </p>
                    <label className="cursor-pointer rounded bg-info-50 px-2 py-1 text-xs font-bold text-info-700">
                      {galleryMutation.isPending
                        ? "Yükleniyor..."
                        : "Menü fotoğrafları ekle"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="sr-only"
                        disabled={galleryMutation.isPending}
                        onChange={(event) => {
                          const files = Array.from(event.target.files || []);
                          if (files.length)
                            galleryMutation.mutate({ menuId: menu.id, files });
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(menu)}
                        className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => copyMutation.mutate(menu.id)}
                        className="text-xs px-2 py-1 bg-info-50 text-info-700 rounded"
                      >
                        Kopyala
                      </button>
                      <button
                        onClick={() => setTimelineMenuId(menu.id)}
                        className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded"
                      >
                        Sürümler
                      </button>
                      <button
                        onClick={() =>
                          menu.active
                            ? setMenuToDeactivate(menu.id)
                            : toggleMutation.mutate(menu.id)
                        }
                        disabled={toggleMutation.isPending}
                        className={`text-xs px-2 py-1 rounded ${menu.active ? "bg-warning-100 text-warning-600 hover:bg-warning-200" : "bg-success-100 text-success-600 hover:bg-success-200"}`}
                      >
                        {menu.active ? "Pasife Al" : "Aktif Yap"}
                      </button>
                      <button
                        onClick={() => setDeleteMenuId(menu.id)}
                        disabled={deleteMutation.isPending}
                        className="text-xs px-2 py-1 bg-danger-50 text-danger-600 rounded hover:bg-danger-100"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredMenus.length === 0 && (
            <EmptyState
              title="Aramanızla eşleşen menü bulunamadı"
              description="Arama metnini veya durum filtresini değiştirerek tekrar deneyin."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setMenuSearch("");
                    setMenuStatusFilter("ALL");
                  }}
                >
                  Filtreleri temizle
                </Button>
              }
            />
          )}
        </>
      )}

      </div>

      {timelineMenuId !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Fiyat sürümleri"
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-primary-600">
                  Menü fiyat geçmişi
                </p>
                <h3 className="mt-1 text-xl font-black">
                  Sürümler ve gelecek fiyatlar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTimelineMenuId(null)}
                aria-label="Sürüm penceresini kapat"
                className="rounded-lg px-2 text-xl text-slate-500"
              >
                ×
              </button>
            </div>
            <p className="mt-3 rounded-xl bg-primary-50 p-3 text-sm text-primary-900">
              Yeni fiyatlar yalnız sonraki abonelik seçimlerinde geçerlidir.
              Mevcut abonelikler, seçtikleri fiyat sürümüyle korunur.
            </p>
            {isLoadingVersions ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Sürümler yükleniyor…
              </p>
            ) : menuVersions.length ? (
              <ol className="mt-5 space-y-4 border-l-2 border-primary-100 pl-5">
                {menuVersions.map((version) => (
                  <li key={version.id} className="relative">
                    <span className="absolute -left-[1.7rem] top-1 h-3 w-3 rounded-full bg-primary-600 ring-4 ring-white" />
                    <p className="font-bold">
                      v{version.versionNumber} ·{" "}
                      {version.pricePerPerson.toLocaleString("tr-TR")} ₺
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Geçerlilik:{" "}
                      {new Date(version.effectiveFrom).toLocaleDateString(
                        "tr-TR",
                      )}{" "}
                      · {version.subscriptionCount} mevcut abonelik korunuyor
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                Bu menü için kayıtlı fiyat sürümü yok.
              </p>
            )}
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={() => setTimelineMenuId(null)}
                variant="outline"
              >
                Kapat
              </Button>
            </div>
          </section>
        </div>
      )}
      <ConfirmModal
        open={deleteMenuId !== null}
        title="Menüyü sil"
        message="Bu menü kalıcı olarak silinecek. İşleme devam etmek istiyor musunuz?"
        confirmLabel="Menüyü sil"
        danger
        pending={deleteMutation.isPending}
        onClose={() => setDeleteMenuId(null)}
        onConfirm={() => deleteMenuId && deleteMutation.mutate(deleteMenuId)}
      />
      <ConfirmModal
        open={menuToDeactivate !== null}
        title="Menüyü pasife al"
        message="Menü yeni aboneliklere kapatılacak. Mevcut abonelikler seçtikleri menü sürümüyle devam eder ve etkilenmez."
        confirmLabel="Pasife al"
        danger
        pending={toggleMutation.isPending}
        onClose={() => setMenuToDeactivate(null)}
        onConfirm={() => {
          if (menuToDeactivate) {
            toggleMutation.mutate(menuToDeactivate);
            setMenuToDeactivate(null);
          }
        }}
      />
    </div>
  );
}
