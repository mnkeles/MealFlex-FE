import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import QueryBoundary from "@/components/ui/QueryBoundary";

export default function StoreReviewsPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [unansweredOnly, setUnansweredOnly] = useState(false);

  const query = useQuery({
    queryKey: ["store-reviews", storeId, page],
    queryFn: () => sellerService.getStoreReviews(storeId, page),
    enabled: !!storeId,
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, text }: { reviewId: number; text: string }) =>
      sellerService.replyToReview(reviewId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-reviews", storeId] });
      setReplyingId(null);
      setReply("");
    },
  });

  const renderStars = (rating: number) =>
    "★".repeat(rating) + "☆".repeat(5 - rating);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e6e1d8] pb-5">
        <div>
          <p className="customer-eyebrow">Müşteri geri bildirimi</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">Yorumlar</h2>
          <p className="mt-1 text-sm text-slate-500">Puanları izleyin ve müşterilere mağaza adına yanıt verin.</p>
        </div>
        <button
          onClick={() => setUnansweredOnly((value) => !value)}
          className={`rounded-lg border px-3 py-2 text-xs font-bold ${unansweredOnly ? "border-primary-300 bg-primary-50 text-primary-700" : "bg-white text-slate-600"}`}
        >
          Yalnız yanıtsızlar
        </button>
      </div>

      <QueryBoundary
        query={query}
        loadingLabel="Yorumlar yükleniyor…"
        errorTitle="Yorumlar yüklenemedi"
        isEmpty={(result) =>
          !result.content.filter(
            (review) => !unansweredOnly || !review.sellerReply,
          ).length
        }
        emptyTitle={
          unansweredOnly
            ? "Yanıt bekleyen yorum bulunmuyor"
            : "Henüz yorum bulunmuyor"
        }
      >
        {(data) => (
          <>
            <div className="space-y-4">
              {data.content
                .filter((review) => !unansweredOnly || !review.sellerReply)
                .map((review) => (
                  <div
                    key={review.id}
                    className="mf-surface p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {review.customerName}
                        </p>
                        <p className="text-warning-500 text-sm mt-0.5">
                          {renderStars(review.rating)}
                        </p>
                        {review.comment && (
                          <p className="text-sm text-slate-600 mt-2">
                            {review.comment}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                    {review.sellerReply && (
                      <div className="mt-4 ml-4 rounded-lg border-l-4 border-primary-400 bg-primary-50 p-3">
                        <p className="text-xs font-semibold text-primary-700">
                          Satıcı yanıtı
                          {review.sellerRepliedAt
                            ? ` · ${Math.max(0, Math.round((new Date(review.sellerRepliedAt).getTime() - new Date(review.createdAt).getTime()) / 3600000))} saatte yanıtlandı`
                            : ""}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {review.sellerReply}
                        </p>
                      </div>
                    )}
                    {replyingId === review.id ? (
                      <div className="mt-4 flex gap-2">
                        <textarea
                          value={reply}
                          onChange={(event) => setReply(event.target.value)}
                          maxLength={2000}
                          className="flex-1 rounded-lg border px-3 py-2 text-sm"
                          rows={2}
                          placeholder="Yanıtınızı yazın..."
                        />
                        <button
                          onClick={() =>
                            reply.trim() &&
                            replyMutation.mutate({
                              reviewId: review.id,
                              text: reply,
                            })
                          }
                          disabled={!reply.trim() || replyMutation.isPending}
                          className="self-end rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => {
                            setReplyingId(null);
                            setReply("");
                          }}
                          className="self-end px-2 py-2 text-sm text-slate-500"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingId(review.id);
                          setReply(review.sellerReply || "");
                        }}
                        className="mt-3 text-xs font-medium text-primary-600 hover:underline"
                      >
                        {review.sellerReply ? "Yanıtı Düzenle" : "Yanıtla"}
                      </button>
                    )}
                  </div>
                ))}
            </div>
            {data.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.first}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Önceki
                </button>
                <span className="px-3 py-1 text-sm">
                  {data.number + 1} / {data.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.last}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            )}
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
