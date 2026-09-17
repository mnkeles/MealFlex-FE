import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import type { Page } from "@/types";
import { getNotificationLink } from "@/utils/notificationLinks";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import QueryBoundary from "@/components/ui/QueryBoundary";

interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  referenceType?: string;
  referenceId?: number;
  targetUrl?: string;
}

const notificationGroups: Record<string, string> = {
  SUBSCRIPTION: "Abonelikler",
  DELIVERY: "Teslimatlar",
  PAYMENT: "Ödemeler",
  COMPLAINT: "Destek talepleri",
  ACCOUNT: "Hesap",
};

function groupNotifications(items: Notification[]) {
  return items.reduce<Record<string, Notification[]>>((result, item) => {
    const key =
      notificationGroups[item.referenceType || ""] || "Diğer güncellemeler";
    (result[key] ||= []).push(item);
    return result;
  }, {});
}

function NotificationSection({
  title,
  items,
  onOpen,
  role,
}: {
  title: string;
  items: Notification[];
  onOpen: (item: Notification) => void;
  role: "CUSTOMER" | "ADMIN";
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
        {title}
      </h2>
      {items.map((item) => {
        const link = getNotificationLink(item, role);
        return (
          <button
            key={item.id}
            onClick={() => onOpen(item)}
            className={`flex w-full items-start gap-4 border-b border-slate-100 p-5 text-left last:border-0 hover:bg-slate-50 ${item.read ? "opacity-60" : ""}`}
          >
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.read ? "bg-slate-300" : "bg-primary-600"}`}
            />
            <span className="flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold">{item.title}</span>
                {item.read && (
                  <CheckCheck
                    className="h-4 w-4 text-success-500"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                {item.message}
              </span>
              <span className="mt-2 block text-xs text-slate-500">
                {new Date(item.createdAt).toLocaleString("tr-TR")}
              </span>
            </span>
            {link && (
              <span className="text-xs font-bold text-primary-600">
                Görüntüle →
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}

export default function NotificationsPage({ role = "CUSTOMER" }: { role?: "CUSTOMER" | "ADMIN" }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      (
        await api.get<Page<Notification>>("/v1/notifications", {
          params: { size: 50 },
        })
      ).data,
  });
  const markRead = useMutation({
    mutationFn: async (id: number) => api.patch(`/v1/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notification-unread-count"],
      });
    },
  });
  const markAllRead = useMutation({
    mutationFn: async () => api.patch("/v1/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notification-unread-count"],
      });
    },
  });
  const open = async (item: Notification) => {
    try {
      if (!item.read) await markRead.mutateAsync(item.id);
    } finally {
      const link = getNotificationLink(item, role);
      if (link) navigate(link);
    }
  };
  const hasUnread = query.data?.content.some((item) => !item.read);

  return (
    <div className="mf-page">
      <PageHeader
        eyebrow="Güncellemeler"
        title="Bildirimler"
        description="Abonelik, teslimat ve hesap güncellemelerinizi buradan takip edin."
        actions={
          hasUnread ? (
            <Button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              variant="outline"
              size="sm"
            >
              Tümünü okundu işaretle
            </Button>
          ) : undefined
        }
      />
      <div className="mt-7">
        <QueryBoundary
          query={query}
          errorTitle="Bildirimler yüklenemedi"
          isEmpty={(data) => data.content.length === 0}
          emptyTitle="Yeni bildiriminiz bulunmuyor"
        >
          {(data) => (
            <div className="space-y-5">
              {Object.entries(groupNotifications(data.content)).map(
                ([group, items]) => (
                  <NotificationSection
                    key={group}
                    title={group}
                    items={items}
                    onOpen={open}
                    role={role}
                  />
                ),
              )}
            </div>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
}
