import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { storeService } from "@/services/storeService";

export default function FavoriteButton({
  storeId,
  className = "",
}: {
  storeId: number;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const { data: favorite = false } = useQuery({
    queryKey: ["favorite-check", storeId],
    queryFn: () => storeService.isFavorite(storeId),
  });
  const mutation = useMutation({
    mutationFn: (nextFavorite: boolean) =>
      nextFavorite
        ? storeService.addFavorite(storeId)
        : storeService.removeFavorite(storeId),
    onMutate: async (nextFavorite) => {
      await queryClient.cancelQueries({
        queryKey: ["favorite-check", storeId],
      });
      const previousFavorite =
        queryClient.getQueryData<boolean>(["favorite-check", storeId]) ?? false;
      queryClient.setQueryData(["favorite-check", storeId], nextFavorite);
      return { previousFavorite };
    },
    onError: (_error, _nextFavorite, context) =>
      queryClient.setQueryData(
        ["favorite-check", storeId],
        context?.previousFavorite ?? false,
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-check", storeId] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  return (
    <button
      type="button"
      aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        mutation.mutate(!favorite);
      }}
      disabled={mutation.isPending}
      className={`grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-600 shadow-sm transition hover:scale-105 hover:text-primary-600 disabled:opacity-50 ${className}`}
    >
      <Heart
        className={`h-5 w-5 ${favorite ? "fill-primary-600 text-primary-600" : ""}`}
      />
    </button>
  );
}
