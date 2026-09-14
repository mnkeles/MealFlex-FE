import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Navigation, Phone, WifiOff } from "lucide-react";
import { sellerService } from "@/services/sellerService";
import StatusBadge from "@/components/ui/StatusBadge";

type PendingAssignment = {
  deliveryId: number;
  courierId: number;
  routeSequence: number;
};
const maskPhone = (value?: string) =>
  value && value.length > 4
    ? `${value.slice(0, 3)} ••• •• ${value.slice(-2)}`
    : value || "Telefon yok";

export default function StoreCouriersPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const client = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCourierId, setSelectedCourierId] = useState<number>();
  const [online, setOnline] = useState(navigator.onLine);
  const queueKey = `mealflex-courier-queue-${storeId}`;
  const [queued, setQueued] = useState<PendingAssignment[]>(() =>
    JSON.parse(localStorage.getItem(queueKey) || "[]"),
  );
  const couriers = useQuery({
    queryKey: ["couriers", storeId],
    queryFn: () => sellerService.getCouriers(storeId),
    enabled: !!storeId,
  });
  const deliveries = useQuery({
    queryKey: ["courier-deliveries", storeId],
    queryFn: () => sellerService.getTodaysDeliveries(storeId),
    enabled: !!storeId,
  });
  const create = useMutation({
    mutationFn: () =>
      sellerService.createCourier(storeId, { fullName: name, phone, email }),
    onSuccess: () => {
      setName("");
      setPhone("");
      setEmail("");
      client.invalidateQueries({ queryKey: ["couriers", storeId] });
    },
  });
  const assign = useMutation({
    mutationFn: ({ deliveryId, courierId, routeSequence }: PendingAssignment) =>
      sellerService.assignCourier(storeId, deliveryId, {
        courierId,
        routeSequence,
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["courier-deliveries", storeId] }),
  });

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  useEffect(() => {
    localStorage.setItem(queueKey, JSON.stringify(queued));
  }, [queueKey, queued]);
  useEffect(() => {
    if (!online || !queued.length) return;
    Promise.all(
      queued.map((item) =>
        sellerService.assignCourier(storeId, item.deliveryId, {
          courierId: item.courierId,
          routeSequence: item.routeSequence,
        }),
      ),
    )
      .then(() => {
        setQueued([]);
        client.invalidateQueries({ queryKey: ["courier-deliveries", storeId] });
      })
      .catch(() => undefined);
  }, [online, queued, storeId, client]);
  const activeCourier = couriers.data?.find(
    (courier) => courier.id === selectedCourierId,
  );
  const route = useMemo(
    () =>
      (deliveries.data || [])
        .filter((delivery) => delivery.courierId === selectedCourierId)
        .sort((a, b) => (a.routeSequence || 999) - (b.routeSequence || 999)),
    [deliveries.data, selectedCourierId],
  );
  const assignOrQueue = (item: PendingAssignment) => {
    if (!online) {
      setQueued((current) => [
        ...current.filter((value) => value.deliveryId !== item.deliveryId),
        item,
      ]);
      return;
    }
    assign.mutate(item);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">Kurye çalışma alanı</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kurye atamalarını ve mobil rota görünümünü yönetin. Telefon numaraları
          operasyon için maskeli gösterilir.
        </p>
      </div>
      {!online && (
        <div className="flex items-center gap-2 rounded-xl bg-warning-50 p-3 text-sm font-semibold text-warning-800">
          <WifiOff className="h-4 w-4" />
          Çevrimdışısınız. Atama değişiklikleri bağlantı geldiğinde yeniden
          gönderilecek.
        </div>
      )}
      {!!queued.length && (
        <div className="rounded-xl bg-info-50 p-3 text-sm text-info-800">
          Bağlantı bekleyen {queued.length} kurye ataması var.
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
        className="flex flex-wrap gap-2 rounded-2xl border bg-white p-4"
      >
        <input
          aria-label="Kurye adı"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Kurye adı"
          className="min-w-48 flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <input
          aria-label="Kurye telefonu"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Telefon (yalnız operasyon için)"
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <input
          aria-label="Kurye personel e-postası"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Kurye personel e-postası"
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <button
          disabled={create.isPending}
          className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Kurye ekle
        </button>
        <p className="w-full text-xs text-slate-500">
          Önce aynı e-posta ile Personel ekranından <b>Kurye</b> rolü davet
          edin. Daveti kabul eden kişi <code>/courier</code> adresinden yalnız
          kendi rotasını görür.
        </p>
      </form>
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-2xl border bg-white p-5">
          <h3 className="font-black">Kuryeler</h3>
          <div className="mt-3 space-y-2">
            {couriers.data?.map((courier) => (
              <button
                key={courier.id}
                onClick={() => setSelectedCourierId(courier.id)}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-left text-sm ${selectedCourierId === courier.id ? "bg-primary-50 text-primary-800" : "bg-slate-50"}`}
              >
                <span>
                  <strong className="block">{courier.fullName}</strong>
                  <span className="text-xs text-slate-500">
                    <Phone className="mr-1 inline h-3 w-3" />
                    {maskPhone(courier.phone)}
                  </span>
                </span>
                <StatusBadge tone={courier.active ? "success" : "neutral"}>
                  {courier.active ? "Aktif" : "Pasif"}
                </StatusBadge>
              </button>
            )) || <p className="py-3 text-sm text-slate-500">Kurye yok.</p>}
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-5">
          <h3 className="font-black">
            {activeCourier
              ? `${activeCourier.fullName} için mobil rota`
              : "Bugünkü rota ve atamalar"}
          </h3>
          {activeCourier ? (
            <div className="mt-3 space-y-3">
              {route.length ? (
                route.map((delivery, index) => (
                  <article
                    key={delivery.id}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <strong>
                        {delivery.routeSequence || index + 1}. durak ·{" "}
                        {delivery.deliveryTime}
                      </strong>
                      <StatusBadge domain="delivery" status={delivery.status} />
                    </div>
                    <p className="mt-2 text-sm">
                      {delivery.customerName} · {delivery.menuName} ·{" "}
                      {delivery.personCount} kişi
                    </p>
                    <p className="mt-2 flex gap-1 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {delivery.deliveryAddressDetails ||
                        delivery.deliveryAddress}
                    </p>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.openstreetmap.org/?q=${encodeURIComponent(delivery.deliveryAddressDetails || delivery.deliveryAddress || "")}`}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-700"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Haritada aç
                    </a>
                  </article>
                ))
              ) : (
                <p className="py-6 text-sm text-slate-500">
                  Bu kuryeye atanmış teslimat yok.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {deliveries.data?.map((delivery, index) => (
                <div
                  key={delivery.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"
                >
                  <b>
                    {delivery.deliveryTime.slice(0, 5)} ·{" "}
                    {delivery.customerName}
                  </b>
                  <span>
                    {delivery.menuName} / {delivery.personCount} kişi
                  </span>
                  <select
                    value={delivery.courierId || ""}
                    onChange={(event) =>
                      event.target.value &&
                      assignOrQueue({
                        deliveryId: delivery.id,
                        courierId: Number(event.target.value),
                        routeSequence: delivery.routeSequence || index + 1,
                      })
                    }
                    className="ml-auto rounded border p-2"
                  >
                    <option value="">Kurye ata</option>
                    {couriers.data
                      ?.filter((courier) => courier.active)
                      .map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.fullName}
                        </option>
                      ))}
                  </select>
                  <span className="rounded bg-white px-2 py-1">
                    Rota {delivery.routeSequence || index + 1}
                  </span>
                </div>
              )) || <p className="text-sm text-slate-500">Teslimat yok.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
