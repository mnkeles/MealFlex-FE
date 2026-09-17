import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";

export default function SellerMenusPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    pricePerPerson: "",
    allergenInfo: "",
  });
  const [items, setItems] = useState([{ name: "", description: "" }]);

  const { data: menus = [], isLoading } = useQuery({
    queryKey: ["seller-menus"],
    queryFn: sellerService.getMyMenus,
  });

  const createMutation = useMutation({
    mutationFn: sellerService.createMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-menus"] });
      setShowForm(false);
      setForm({
        name: "",
        description: "",
        pricePerPerson: "",
        allergenInfo: "",
      });
      setItems([{ name: "", description: "" }]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      pricePerPerson: Number(form.pricePerPerson),
      allergenInfo: form.allergenInfo || undefined,
      items: items
        .filter((i) => i.name)
        .map((i, idx) => ({ ...i, sortOrder: idx })),
    });
  };

  const addItem = () => setItems([...items, { name: "", description: "" }]);
  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], [field]: value };
    setItems(newItems);
  };

  return (
    <div className="mf-page">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e6e1d8] pb-5">
        <div>
          <p className="customer-eyebrow">Ürün yönetimi</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Menüler</h1>
          <p className="mt-1 text-sm text-slate-500">Fiyatları, içerikleri ve alerjen bilgilerini tek yerde yönetin.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
        >
          {showForm ? "İptal" : "+ Yeni Menü"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mf-surface p-6 mb-6"
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
                className="mf-input"
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
                className="mf-input"
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
                className="mf-input"
                rows={2}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                Menü İçeriği
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-primary-600 hover:underline"
              >
                + Ekle
              </button>
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
                  placeholder="Açıklama (opsiyonel)"
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
            disabled={createMutation.isPending}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Kaydediliyor..." : "Menü Oluştur"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : menus.length === 0 ? (
        <div className="mf-surface p-12 text-center text-slate-500">
          Henüz menü oluşturulmamış.
        </div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => (
            <div key={menu.id} className="mf-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{menu.name}</h3>
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
                  {menu.items.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {menu.items.map((item) => (
                        <span
                          key={item.id}
                          className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs"
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-lg font-bold text-primary-600 shrink-0">
                  {menu.pricePerPerson} ₺
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
