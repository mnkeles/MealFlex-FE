import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import { useNavigate } from "react-router-dom";
import { getNotificationLink } from "@/utils/notificationLinks";

export default function SellerNotificationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["seller-notifications", page],
    queryFn: () => sellerService.getNotifications(page),
  });

  const markReadMutation = useMutation({
    mutationFn: sellerService.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["seller-unread-count"] });
    },
  });

  const openNotification = async (
    notification: NonNullable<typeof data>["content"][number],
  ) => {
    try {
      if (!notification.read) await markReadMutation.mutateAsync(notification.id);
    } finally {
      const link = getNotificationLink(notification, "SELLER");
      if (link) navigate(link);
    }
  };

  return (
    <div className="mf-page">
      <div className="border-b border-[#e6e1d8] pb-5">
        <p className="customer-eyebrow">Hesap akışı</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Bildirimler</h1>
        <p className="mt-1 text-sm text-slate-500">Talepler, ödemeler ve operasyon gelişmeleri burada toplanır.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : !data?.content.length ? (
        <div className="mf-surface p-12 text-center text-slate-500">
          Bildirim bulunmuyor.
        </div>
      ) : (
        <>
          <div className="mf-surface divide-y">
            {data.content.map((n) => (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => openNotification(n)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openNotification(n);
                  }
                }}
                className={`p-4 flex items-start gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-200 ${!n.read ? "bg-primary-50/50" : ""}`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? "bg-primary-600" : "bg-transparent"}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm font-medium ${!n.read ? "text-slate-900" : "text-slate-600"}`}
                    >
                      {n.title}
                    </h3>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  {!n.read && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        markReadMutation.mutate(n.id);
                      }}
                      className="text-xs text-primary-600 hover:underline mt-1"
                    >
                      Okundu olarak işaretle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
              >
                Önceki
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-600">
                {page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
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
