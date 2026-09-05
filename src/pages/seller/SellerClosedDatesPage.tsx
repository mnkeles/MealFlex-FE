import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import QueryBoundary from "@/components/ui/QueryBoundary";
import { FormField } from "@/components/ui/FormField";
import Button from "@/components/ui/Button";
import api from "@/services/api";

type ClosedDate = { id: number; date: string; reason: string };

const closedDateSchema = z.object({
  date: z.string().min(1, "Kapalı günü seçin."),
  reason: z.string().trim().max(250, "Sebep en fazla 250 karakter olabilir."),
});

type ClosedDateForm = z.infer<typeof closedDateSchema>;

export default function SellerClosedDatesPage() {
  const queryClient = useQueryClient();
  const query = useQuery<ClosedDate[]>({
    queryKey: ["seller-closed-dates"],
    queryFn: async () =>
      (await api.get<ClosedDate[]>("/v1/seller/closed-dates")).data,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClosedDateForm>({
    resolver: zodResolver(closedDateSchema),
    defaultValues: { date: "", reason: "" },
  });
  const addMutation = useMutation({
    mutationFn: async (data: ClosedDateForm) => {
      await api.post("/v1/seller/closed-dates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-closed-dates"] });
      reset();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/v1/seller/closed-dates/${id}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["seller-closed-dates"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Özel kapalı günler</h1>
      <form
        onSubmit={handleSubmit((values) => addMutation.mutate(values))}
        className="mb-6 rounded-xl bg-white p-6 shadow-sm"
        noValidate
      >
        <div className="grid items-start gap-3 sm:grid-cols-[minmax(10rem,.5fr)_minmax(14rem,1fr)_auto]">
          <FormField
            label="Tarih"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            error={errors.date?.message}
            required
            {...register("date")}
          />
          <FormField
            label="Sebep"
            placeholder="Resmi tatil, bakım vb."
            error={errors.reason?.message}
            {...register("reason")}
          />
          <Button
            type="submit"
            className="sm:mt-6"
            disabled={addMutation.isPending}
          >
            {addMutation.isPending ? "Ekleniyor…" : "Ekle"}
          </Button>
        </div>
        {addMutation.isError && (
          <p
            role="alert"
            className="mt-3 text-sm font-semibold text-danger-600"
          >
            Kapalı gün eklenemedi. Tarihi kontrol edip tekrar deneyin.
          </p>
        )}
      </form>
      <QueryBoundary
        query={query}
        loadingLabel="Kapalı günler yükleniyor…"
        errorTitle="Kapalı günler yüklenemedi"
        isEmpty={(items) => items.length === 0}
        emptyTitle="Kapalı gün tanımlanmamış"
      >
        {(items) => (
          <div className="divide-y rounded-xl bg-white shadow-sm">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="text-sm font-medium">{item.date}</p>
                  {item.reason && (
                    <p className="text-xs text-slate-500">{item.reason}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-danger-600 hover:text-danger-700 disabled:opacity-50"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
