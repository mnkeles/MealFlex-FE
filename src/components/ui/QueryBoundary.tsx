import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

type QueryBoundaryProps<T> = {
  query: UseQueryResult<T>;
  loadingLabel?: string;
  loadingFallback?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  emptyIcon?: ReactNode;
  children: (data: T) => ReactNode;
};

/**
 * Ortak React Query yükleme / hata / boş durum sarmalayıcısı.
 * Sayfalarda tekrarlanan `isLoading ? ... : isError ? ... : !data.length ? ... : ...`
 * zincirini merkezileştirir.
 */
export default function QueryBoundary<T>({
  query,
  loadingLabel = "Yükleniyor…",
  loadingFallback,
  errorTitle = "Kayıtlar yüklenemedi",
  errorDescription = "Bağlantıyı kontrol edip tekrar deneyin.",
  isEmpty,
  emptyTitle = "Kayıt bulunamadı",
  emptyDescription,
  emptyAction,
  emptyIcon,
  children,
}: QueryBoundaryProps<T>) {
  if (query.isLoading)
    return (
      <>
        {loadingFallback || (
          <div
            className="mf-surface p-10 text-center text-sm text-slate-500"
            role="status"
          >
            {loadingLabel}
          </div>
        )}
      </>
    );
  if (query.isError)
    return (
      <EmptyState
        title={errorTitle}
        description={errorDescription}
        action={
          <Button onClick={() => query.refetch()} variant="outline" size="sm">
            Tekrar dene
          </Button>
        }
      />
    );
  if (query.data === undefined) return null;
  if (isEmpty?.(query.data))
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        icon={emptyIcon}
      />
    );
  return <>{children(query.data)}</>;
}
