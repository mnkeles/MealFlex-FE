import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";

export default function SellerDeliveriesPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["seller-deliveries", date],
    queryFn: () =>
      date === new Date().toISOString().split("T")[0]
        ? sellerService.getTodaysDeliveries()
        : sellerService.getDeliveriesByDate(date),
  });

  const deliverMutation = useMutation({
    mutationFn: ({
      deliveryId,
      deliveryCode,
    }: {
      deliveryId: number;
      deliveryCode: string;
    }) => sellerService.markAsDelivered(deliveryId, deliveryCode),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["seller-deliveries"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Teslimatlar</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : deliveries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-slate-500">
          Bu tarih için teslimat bulunmuyor.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {deliveries.map((d) => (
            <div key={d.id} className="p-5 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-primary-600">
                    {d.deliveryTime}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      d.status === "DELIVERED"
                        ? "bg-success-100 text-success-700"
                        : "bg-warning-100 text-warning-700"
                    }`}
                  >
                    {d.status === "DELIVERED" ? "Teslim Edildi" : "Bekliyor"}
                  </span>
                </div>
                <p className="font-medium mt-1">{d.customerName}</p>
                <p className="text-sm text-slate-500">
                  {d.menuName} · {d.personCount} kişi
                </p>
                {d.deliveryAddress && (
                  <p className="text-xs text-slate-400 mt-1">
                    {d.deliveryAddress}
                  </p>
                )}
                {d.notes && (
                  <p className="text-xs text-info-600 mt-1">Not: {d.notes}</p>
                )}
              </div>
              {d.status !== "DELIVERED" && (
                <button
                  onClick={() => {
                    const deliveryCode = window.prompt(
                      "Müşterinin 4 haneli teslimat kodunu girin:",
                    );
                    if (!deliveryCode || !/^\d{4}$/.test(deliveryCode)) return;
                    deliverMutation.mutate({ deliveryId: d.id, deliveryCode });
                  }}
                  disabled={deliverMutation.isPending}
                  className="bg-success-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-success-700 disabled:opacity-50 shrink-0"
                >
                  Teslim Edildi
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
