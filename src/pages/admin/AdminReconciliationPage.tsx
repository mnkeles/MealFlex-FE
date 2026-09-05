import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CircleCheckBig, CircleAlert } from "lucide-react";
import {
  adminService,
  type FinanceReconciliation,
} from "@/services/adminService";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import QueryBoundary from "@/components/ui/QueryBoundary";
import StatusBadge from "@/components/ui/StatusBadge";

const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    value,
  );

export default function AdminReconciliationPage() {
  const client = useQueryClient();
  const [selected, setSelected] = useState<FinanceReconciliation>();
  const [note, setNote] = useState("");
  const query = useQuery({
    queryKey: ["finance-reconciliations"],
    queryFn: adminService.getFinanceReconciliations,
  });
  const resolve = useMutation({
    mutationFn: () =>
      adminService.resolveFinanceReconciliation(selected!.id, note),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["finance-reconciliations"] });
      setSelected(undefined);
      setNote("");
    },
  });

  return (
    <div className="mf-page space-y-6">
      <PageHeader
        eyebrow="Finans kontrolü"
        title="Finansal mutabakat"
        description="Sağlayıcı tahsilatını, finans defterini ve satıcı aktarımlarını günlük olarak karşılaştırın."
      />
      <QueryBoundary
        query={query}
        loadingLabel="Mutabakat kayıtları yükleniyor…"
        errorTitle="Mutabakat kayıtları yüklenemedi"
        isEmpty={(items) => items.length === 0}
        emptyTitle="Henüz mutabakat kaydı oluşmadı"
        emptyDescription="Günlük finans kontrolü tamamlandığında bu listede görünür."
      >
        {(items) => (
          <div className="mf-surface overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Sağlayıcı</th>
                  <th className="px-4 py-3">Defter</th>
                  <th className="px-4 py-3">Ödenen hakediş</th>
                  <th className="px-4 py-3">Fark</th>
                  <th className="px-4 py-3">Sorumlu / yaş</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const ageDays = Math.max(
                    0,
                    Math.floor(
                      (Date.now() -
                        new Date(`${item.date}T00:00:00`).getTime()) /
                        86_400_000,
                    ),
                  );
                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-semibold text-ink">
                        {new Date(item.date).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        {money(item.providerCollectedAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {money(item.ledgerCollectedAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {money(item.paidPayoutAmount)}
                      </td>
                      <td
                        className={`px-4 py-3 font-black ${item.discrepancyAmount ? "text-danger-600" : "text-success-700"}`}
                      >
                        {money(item.discrepancyAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <p>{item.assignedAdmin || "Atanmadı"}</p>
                        <p
                          className={`mt-1 text-xs font-bold ${ageDays > 2 ? "text-danger-600" : "text-slate-500"}`}
                        >
                          {ageDays} gün
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          tone={
                            item.status === "REVIEW_REQUIRED"
                              ? "warning"
                              : "success"
                          }
                        >
                          {item.status === "REVIEW_REQUIRED"
                            ? "İnceleme gerekli"
                            : "Mutabık"}
                        </StatusBadge>
                        {item.resolutionNote && (
                          <p className="mt-1 max-w-xs text-xs text-slate-500">
                            {item.resolutionNote}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.status === "REVIEW_REQUIRED" && (
                          <Button
                            onClick={() => {
                              setSelected(item);
                              setNote("");
                            }}
                            variant="outline"
                            size="sm"
                          >
                            İncele
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </QueryBoundary>
      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <section
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mutabakat farkı inceleme"
          >
            <div className="flex gap-3">
              <CircleAlert className="text-warning-600" />
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-primary-600">
                  Finans incelemesi
                </p>
                <h2 className="font-black">Mutabakat farkını kapat</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fark: {money(selected.discrepancyAmount)}
                </p>
              </div>
            </div>
            <label className="mf-label mt-5 block">
              İnceleme sonucu
              <textarea
                required
                rows={4}
                maxLength={1000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="İnceleme sonucu ve sorumlu notu"
                className="mf-textarea mt-2 w-full"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                onClick={() => setSelected(undefined)}
                variant="ghost"
                size="sm"
              >
                Vazgeç
              </Button>
              <Button
                disabled={!note.trim() || resolve.isPending}
                onClick={() => resolve.mutate()}
                size="sm"
                leftIcon={<CircleCheckBig size={15} />}
              >
                Çözüldü olarak işaretle
              </Button>
            </div>
            {resolve.isError && (
              <p className="mt-3 text-sm text-danger-600">
                Mutabakat kaydedilemedi.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
