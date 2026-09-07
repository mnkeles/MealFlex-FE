import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, BellRing } from "lucide-react";
import { sellerService, type ComplaintItem } from "@/services/sellerService";
import StatusBadge from "@/components/ui/StatusBadge";
import { complaintStatusConfig } from "@/constants/complaintStatus";

function complaintTimeline(c: ComplaintItem) {
  const responded = !!c.sellerResponse || c.status !== "OPEN";
  const closed = ["RESOLVED", "CLOSED"].includes(c.status);
  return [
    {
      key: "created",
      label: "Talep oluşturuldu",
      date: c.createdAt,
      done: true,
    },
    {
      key: "responded",
      label: "Satıcı incelemesi / yanıtı",
      date: undefined,
      done: responded,
    },
    ...(c.escalatedAt
      ? [
          {
            key: "escalated",
            label: "Yöneticiye eskale edildi",
            date: c.escalatedAt,
            done: true,
          },
        ]
      : []),
    {
      key: "final",
      label: complaintStatusConfig[c.status].label,
      date: undefined,
      done: closed,
    },
  ];
}

export default function StoreComplaintsPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [response, setResponse] = useState("");
  const [escalate, setEscalate] = useState(false);
  const [slaOnly, setSlaOnly] = useState(false);
  const client = useQueryClient();
  const respond = useMutation({
    mutationFn: ({ id }: { id: number }) =>
      sellerService.respondComplaint(id, {
        response,
        status: "IN_REVIEW",
        escalate,
      }),
    onSuccess: () => {
      setEditingId(null);
      setEscalate(false);
      client.invalidateQueries({ queryKey: ["store-complaints", storeId] });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["store-complaints", storeId, page],
    queryFn: () => sellerService.getStoreComplaints(storeId, page),
    enabled: !!storeId,
  });
  const isSlaApproaching = (createdAt: string, complaintStatus: string) =>
    !["RESOLVED", "CLOSED"].includes(complaintStatus) &&
    Date.now() - new Date(createdAt).getTime() >= 20 * 60 * 60 * 1000;
  const visibleComplaints =
    data?.content.filter(
      (complaint) =>
        !slaOnly || isSlaApproaching(complaint.createdAt, complaint.status),
    ) || [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Şikâyetler</h2>
        <button
          type="button"
          onClick={() => setSlaOnly((value) => !value)}
          className={`rounded-lg border px-3 py-2 text-xs font-bold ${slaOnly ? "border-danger-300 bg-danger-50 text-danger-700" : "bg-white text-slate-600"}`}
        >
          SLA yaklaşanlar (20+ saat)
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : !visibleComplaints.length ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-slate-500">
          Şikâyet bulunmuyor.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {visibleComplaints.map((c) => {
              return (
                <div key={c.id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{c.reason}</p>
                      {c.customerName && (
                        <p className="text-xs text-slate-500">
                          {c.customerName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge domain="complaint" status={c.status} />
                      <span className="text-xs text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{c.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Abonelik #{c.subscriptionId || "-"} · Teslimat #
                    {c.deliveryId || "-"}
                  </p>
                  {isSlaApproaching(c.createdAt, c.status) && (
                    <p className="mt-2 rounded-lg bg-danger-50 px-3 py-2 text-xs font-bold text-danger-700">
                      SLA eşiğine ulaşıldı; öncelikli yanıt önerilir.
                    </p>
                  )}
                  {c.adminNote && (
                    <div className="mt-2 p-2 bg-info-50 rounded text-sm text-info-700">
                      <span className="font-medium">Admin notu:</span>{" "}
                      {c.adminNote}
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.08em] text-slate-500">
                        Durum geçmişi
                      </p>
                      <div className="mt-3 space-y-0">
                        {complaintTimeline(c).map((item, index, all) => (
                          <div key={item.key} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <span
                                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${item.done ? "border-success-600 bg-success-600 text-white" : "border-slate-300 bg-white"}`}
                              >
                                {item.done && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                              </span>
                              {index < all.length - 1 && (
                                <span
                                  className={`min-h-8 w-0.5 flex-1 ${item.done ? "bg-success-100" : "bg-slate-200"}`}
                                />
                              )}
                            </div>
                            <div className="pb-3">
                              <p
                                className={`text-xs font-bold ${item.done ? "text-slate-800" : "text-slate-400"}`}
                              >
                                {item.label}
                              </p>
                              {item.date && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {new Date(item.date).toLocaleString("tr-TR")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.08em] text-slate-500">
                        Yanıt
                      </p>
                      {c.sellerResponse && editingId !== c.id && (
                        <div className="mt-3 rounded-lg bg-success-50 p-3 text-sm text-success-800">
                          <b>Kayıtlı yanıt:</b> {c.sellerResponse}
                        </div>
                      )}
                      {editingId === c.id ? (
                        <div className="mt-3 rounded-lg border bg-white p-3">
                          <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Müşteriye yanıt"
                            className="w-full rounded border p-2 text-sm"
                            rows={3}
                          />
                          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={escalate}
                              onChange={(event) => setEscalate(event.target.checked)}
                            />
                            Yönetici incelemesine gönder
                          </label>
                          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                            <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-500" />
                            Yanıtı kaydettiğinizde müşteriye uygulama içi
                            bildirim otomatik olarak gönderilir.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              disabled={!response.trim() || respond.isPending}
                              onClick={() => respond.mutate({ id: c.id })}
                              className="rounded bg-primary-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                            >
                              {respond.isPending
                                ? "Kaydediliyor..."
                                : "Yanıtı kaydet ve müşteriye bildir"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded px-3 py-2 text-sm font-bold text-slate-500"
                            >
                              Vazgeç
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setResponse(c.sellerResponse || "");
                            setEscalate(Boolean(c.escalatedAt));
                          }}
                          className="mt-3 text-sm font-bold text-primary-600"
                        >
                          {c.sellerResponse
                            ? "Yanıtı düzenle / durumu güncelle"
                            : "Yanıtla / durumu güncelle"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {(data?.totalPages || 0) > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data?.first}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Önceki
              </button>
              <span className="px-3 py-1 text-sm">
                {(data?.number || 0) + 1} / {data?.totalPages || 0}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data?.last}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
