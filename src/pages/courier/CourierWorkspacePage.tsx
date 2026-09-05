import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MapPin, Navigation, Truck, WifiOff } from "lucide-react";
import { courierService } from "@/services/courierService";
import type { Delivery, DeliveryStatus } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";

type Pending = {
  id: number;
  data: {
    status: DeliveryStatus;
    deliveryCode?: string;
    proofPhotoUrl?: string;
    receiverName?: string;
  };
};
const queueKey = "mealflex-courier-pending-operations";

export default function CourierWorkspacePage() {
  const client = useQueryClient();
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState<Pending[]>(() =>
    JSON.parse(localStorage.getItem(queueKey) || "[]"),
  );
  const syncingIds = useRef(new Set<number>());
  const [proofFor, setProofFor] = useState<number>();
  const [code, setCode] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [receiver, setReceiver] = useState("");
  const {
    data: deliveries = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courier-workspace-today"],
    queryFn: courierService.today,
  });
  const update = useMutation({
    mutationFn: ({ id, data }: Pending) => courierService.update(id, data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["courier-workspace-today"] });
      setProofFor(undefined);
      setCode("");
      setProofUrl("");
      setReceiver("");
    },
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
    localStorage.setItem(queueKey, JSON.stringify(pending));
  }, [pending]);
  useEffect(() => {
    if (!online || !pending.length) return;
    const itemsToSync = pending.filter(
      (item) => !syncingIds.current.has(item.id),
    );
    if (!itemsToSync.length) return;
    itemsToSync.forEach((item) => syncingIds.current.add(item.id));
    Promise.all(
      itemsToSync.map((item) => courierService.update(item.id, item.data)),
    )
      .then(() => {
        setPending((items) =>
          items.filter(
            (item) => !itemsToSync.some((synced) => synced.id === item.id),
          ),
        );
        client.invalidateQueries({ queryKey: ["courier-workspace-today"] });
      })
      .finally(() =>
        itemsToSync.forEach((item) => syncingIds.current.delete(item.id)),
      );
  }, [online, pending, client]);
  const send = (id: number, data: Pending["data"]) => {
    if (online) update.mutate({ id, data });
    else
      setPending((items) => [
        ...items.filter((item) => item.id !== id),
        { id, data },
      ]);
  };
  const action = (delivery: Delivery) =>
    delivery.status === "SCHEDULED" || delivery.status === "PREPARING" ? (
      <button
        onClick={() => send(delivery.id, { status: "IN_TRANSIT" })}
        className="flex items-center gap-1 rounded-xl bg-info-600 px-4 py-3 text-sm font-bold text-white"
      >
        <Truck className="h-4 w-4" />
        Yola çıktım
      </button>
    ) : delivery.status === "IN_TRANSIT" ? (
      <button
        onClick={() => setProofFor(delivery.id)}
        className="flex items-center gap-1 rounded-xl bg-success-600 px-4 py-3 text-sm font-bold text-white"
      >
        <CheckCircle2 className="h-4 w-4" />
        Teslim et
      </button>
    ) : null;
  if (isLoading)
    return (
      <div className="grid min-h-screen place-items-center text-slate-500">
        Rota yükleniyor…
      </div>
    );
  if (isError)
    return (
      <div className="m-4 rounded-xl bg-danger-50 p-4 text-danger-700">
        Kurye çalışma alanı yüklenemedi. Kurye davetinizin kabul edildiğini
        kontrol edin.
      </div>
    );
  return (
    <main className="mx-auto min-h-screen max-w-xl bg-slate-50 p-4 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-black">Bugünkü rotam</h1>
        <p className="mt-1 text-sm text-slate-500">
          Yalnız size atanmış teslimatlar gösterilir.
        </p>
      </header>
      {!online && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-warning-50 p-3 text-sm font-semibold text-warning-800">
          <WifiOff className="h-4 w-4" />
          Çevrimdışısınız; işlemler bağlantı geldiğinde gönderilecek.
        </div>
      )}
      {pending.length > 0 && (
        <div className="mb-3 rounded-xl bg-info-50 p-3 text-sm text-info-800">
          Gönderilmeyi bekleyen {pending.length} işlem var.
        </div>
      )}
      <div className="space-y-3">
        {deliveries.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
            Bugün için size atanmış teslimat yok.
          </div>
        ) : (
          deliveries.map((delivery, index) => (
            <article
              key={delivery.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-primary-600">
                    {delivery.routeSequence || index + 1}. DURAK ·{" "}
                    {delivery.deliveryTime.slice(0, 5)}
                  </p>
                  <h2 className="mt-1 font-black">{delivery.menuName}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <span>{delivery.personCount} kişilik teslimat</span>
                    <StatusBadge domain="delivery" status={delivery.status} />
                  </div>
                </div>
                {action(delivery)}
              </div>
              <p className="mt-4 flex items-start gap-2 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                {delivery.deliveryAddressDetails || delivery.deliveryAddress}
              </p>
              {delivery.customerPhoneMasked && (
                <p className="mt-2 text-xs text-slate-500">
                  Müşteri telefonu: {delivery.customerPhoneMasked}
                </p>
              )}
              <a
                href={`https://www.openstreetmap.org/?q=${encodeURIComponent(delivery.deliveryAddressDetails || delivery.deliveryAddress || "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary-700"
              >
                <Navigation className="h-4 w-4" />
                Haritada aç
              </a>
              {proofFor === delivery.id && (
                <div className="mt-4 grid gap-2 border-t pt-4">
                  <input
                    value={receiver}
                    onChange={(event) => setReceiver(event.target.value)}
                    placeholder="Teslim alan kişi"
                    className="rounded-xl border px-3 py-2"
                  />
                  <input
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    inputMode="numeric"
                    placeholder="Müşteri teslimat kodu"
                    className="rounded-xl border px-3 py-2"
                  />
                  <input
                    value={proofUrl}
                    onChange={(event) => setProofUrl(event.target.value)}
                    type="url"
                    placeholder="Kod yoksa kanıt fotoğrafı bağlantısı"
                    className="rounded-xl border px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setProofFor(undefined)}
                      className="rounded-xl px-3 py-2 text-sm font-bold"
                    >
                      Vazgeç
                    </button>
                    <button
                      disabled={(!code && !proofUrl) || update.isPending}
                      onClick={() =>
                        send(delivery.id, {
                          status: "DELIVERED",
                          deliveryCode: code || undefined,
                          proofPhotoUrl: proofUrl || undefined,
                          receiverName: receiver || undefined,
                        })
                      }
                      className="rounded-xl bg-success-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Teslimatı tamamla
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </main>
  );
}
