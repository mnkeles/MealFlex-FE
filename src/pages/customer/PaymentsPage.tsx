import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ReceiptText, Trash2, WalletCards } from "lucide-react";
import MockCardTokenizationForm from "@/components/payment/MockCardTokenizationForm";
import { paymentService } from "@/services/paymentService";
import ConfirmModal from "@/components/common/ConfirmModal";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { paymentStatuses } from "@/constants/statuses";

export default function PaymentsPage({
  view = "all",
}: {
  view?: "all" | "methods" | "history";
}) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number>();
  const [historyStatus, setHistoryStatus] = useState("");
  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: paymentService.methods,
  });
  const { data: history = [] } = useQuery({
    queryKey: ["payment-history"],
    queryFn: paymentService.history,
  });
  const { data: mealBalance } = useQuery({
    queryKey: ["meal-balance"],
    queryFn: paymentService.mealBalance,
  });
  const remove = useMutation({
    mutationFn: paymentService.deleteMethod,
    onSuccess: () => {
      setDeleteId(undefined);
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });

  const showMethods = view !== "history";
  const showHistory = view !== "methods";
  const visibleHistory = historyStatus
    ? history.filter((payment) => payment.status === historyStatus)
    : history;
  return (
    <div className="mf-page mx-auto max-w-4xl space-y-7">
      <PageHeader
        eyebrow="Ödeme"
        title={
          view === "methods"
            ? "Kayıtlı ödeme yöntemleri"
            : view === "history"
              ? "Ödeme ve iade geçmişi"
              : "Ödeme yöntemleri ve geçmişi"
        }
        description="Kart numaranız MealFlex sunucularında saklanmaz."
      />
      <div>
        <h1 className="text-3xl font-black">
          {view === "methods"
            ? "Kayıtlı ödeme yöntemleri"
            : view === "history"
              ? "Ödeme ve iade geçmişi"
              : "Ödeme yöntemleri ve geçmişi"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Kart numaranız MealFlex sunucularında saklanmaz.
        </p>
      </div>
      {showMethods && (
        <section className="rounded-3xl border bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <CreditCard className="text-primary-600" />
            Kayıtlı kartlar
          </h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-slate-500">Yükleniyor...</p>
          ) : (
            <div className="my-5 grid gap-3 sm:grid-cols-2">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-2xl border p-4"
                >
                  <div>
                    <strong>
                      {method.brand} •••• {method.lastFour}
                    </strong>
                    <p className="mt-1 text-xs text-slate-500">
                      {String(method.expiryMonth).padStart(2, "0")}/
                      {method.expiryYear}
                      {method.defaultMethod ? " · Varsayılan" : ""}
                    </p>
                  </div>
                  <button
                    aria-label="Kartı sil"
                    onClick={() => setDeleteId(method.id)}
                    className="rounded-lg p-2 text-danger-500 hover:bg-danger-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <MockCardTokenizationForm
            onAdded={() =>
              queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
            }
          />
        </section>
      )}
      {showHistory && (
        <>
          <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <WalletCards className="h-5 w-5" /> Öğün bakiyesi
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-900">
                  {(mealBalance?.availableAmount ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {mealBalance?.currency ?? "TRY"}
                </p>
                <p className="mt-2 max-w-xl text-sm text-emerald-800">
                  Onaylanan porsiyon azaltımlarından oluşur. Yeni haftanın veya ek porsiyonların ücretinde önce bu bakiye kullanılır.
                </p>
              </div>
            </div>
            {!!mealBalance?.recentTransactions.length && (
              <div className="mt-5 border-t border-emerald-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Son bakiye hareketleri</p>
                <div className="mt-2 space-y-2">
                  {mealBalance.recentTransactions.slice(0, 4).map((transaction) => {
                    const isCredit = transaction.type === "DELIVERY_REDUCTION_CREDIT" || transaction.type === "PAYMENT_FAILURE_REVERSAL";
                    return <div key={transaction.id} className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-600">{transaction.description || "Öğün bakiyesi hareketi"}</span>
                      <strong className={isCredit ? "text-emerald-700" : "text-slate-800"}>{isCredit ? "+" : "−"}{transaction.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</strong>
                    </div>;
                  })}
                </div>
              </div>
            )}
          </section>
        <section className="rounded-3xl border bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <ReceiptText className="text-primary-600" />
              Ödeme ve iade geçmişi
            </h2>
            <label className="text-xs font-bold text-slate-600">
              Durum
              <select
                value={historyStatus}
                onChange={(event) => setHistoryStatus(event.target.value)}
                className="ml-2 h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal"
              >
                <option value="">Tümü</option>
                {Object.entries(paymentStatuses).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {history.length ? (
            visibleHistory.length ? (
              <div className="mt-4 divide-y">
                {visibleHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
                  >
                    <div>
                      <strong>Abonelik #{payment.subscriptionId}</strong>
                      <p className="text-xs text-slate-500">
                        {new Date(payment.createdAt).toLocaleString("tr-TR")} ·{" "}
                        {payment.cardLabel}
                      </p>
                      {(payment.balanceAmount > 0 || payment.cardAmount !== payment.grossAmount) && (
                        <p className="mt-1 text-xs text-slate-500">
                          Öğün bakiyesi: {payment.balanceAmount.toLocaleString("tr-TR")} TL · Kart: {payment.cardAmount.toLocaleString("tr-TR")} TL
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <strong className="block">
                        {payment.grossAmount.toLocaleString("tr-TR")}{" "}
                        {payment.currency}
                      </strong>
                      <span className="mt-1 inline-flex">
                        <StatusBadge domain="payment" status={payment.status} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Bu filtrede ödeme veya iade hareketi yok.
              </p>
            )
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Henüz ödeme hareketiniz yok.
            </p>
          )}
        </section>
        </>
      )}
      <ConfirmModal
        open={!!deleteId}
        title="Kartı kaldır"
        message="Bu ödeme yöntemi yeni aboneliklerde kullanılamayacak."
        confirmLabel="Kaldır"
        danger
        pending={remove.isPending}
        onClose={() => setDeleteId(undefined)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </div>
  );
}
