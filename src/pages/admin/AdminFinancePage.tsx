import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Search, Settings, WalletCards } from "lucide-react";
import ConfirmModal from "@/components/common/ConfirmModal";
import {
  adminService,
  type AdminPayment,
  type AdminPayout,
} from "@/services/adminService";
import { accountService } from "@/services/accountService";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  paymentStatuses,
  payoutStatuses,
  uiStatus,
} from "@/constants/statuses";

const money = (value: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(
    value,
  );

export default function AdminFinancePage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<
    "payments" | "refunds" | "disputes" | "payouts" | "configuration"
  >("payments");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [payment, setPayment] = useState<AdminPayment | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payoutToPay, setPayoutToPay] = useState<AdminPayout | null>(null);
  const [payoutPassword, setPayoutPassword] = useState("");
  const [configurationPassword, setConfigurationPassword] = useState("");
  const [commissionForm, setCommissionForm] = useState({
    storeId: "",
    commissionPercent: "12",
    vatPercent: "20",
    effectiveFrom: new Date().toISOString().slice(0, 10),
  });
  const [settingForm, setSettingForm] = useState({
    approvalHours: "72",
    minimumServiceDays: "5",
  });
  const payments = useQuery({
    queryKey: ["admin-payments", appliedSearch],
    queryFn: () =>
      adminService.getPayments({ search: appliedSearch || undefined }),
  });
  const payouts = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: adminService.getPayouts,
    enabled: tab === "payouts",
  });
  const commissionRules = useQuery({
    queryKey: ["admin-commission-rules"],
    queryFn: adminService.getCommissionRules,
    enabled: tab === "configuration",
  });
  const platformSettings = useQuery({
    queryKey: ["admin-platform-settings"],
    queryFn: adminService.getPlatformSettings,
    enabled: tab === "configuration",
  });
  useEffect(() => {
    if (!platformSettings.data) return;
    setSettingForm({
      approvalHours: String(platformSettings.data.SUBSCRIPTION_APPROVAL_SLA_HOURS),
      minimumServiceDays: String(platformSettings.data.MIN_SUBSCRIPTION_SERVICE_DAYS),
    });
  }, [platformSettings.data]);
  const refund = useMutation({
    mutationFn: async () =>
      adminService.refundPayment(
        payment!.id,
        Number(amount),
        reason,
        await accountService.reauthenticate(reauthPassword),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      setConfirmOpen(false);
      setPayment(null);
      setAmount("");
      setReason("");
      setReauthPassword("");
    },
  });
  const payPayout = useMutation({
    mutationFn: async () =>
      adminService.payPayout(
        payoutToPay!.id,
        await accountService.reauthenticate(payoutPassword),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      setPayoutToPay(null);
      setPayoutPassword("");
    },
  });
  const saveCommission = useMutation({
    mutationFn: async () =>
      adminService.createCommissionRule(
        {
          storeId: commissionForm.storeId
            ? Number(commissionForm.storeId)
            : undefined,
          commissionRate: Number(commissionForm.commissionPercent) / 100,
          commissionVatRate: Number(commissionForm.vatPercent) / 100,
          effectiveFrom: commissionForm.effectiveFrom,
        },
        await accountService.reauthenticate(configurationPassword),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-commission-rules"] });
      setConfigurationPassword("");
    },
  });
  const saveSettings = useMutation({
    mutationFn: async () => {
      const approvalToken = await accountService.reauthenticate(configurationPassword);
      await adminService.updatePlatformSetting(
        "SUBSCRIPTION_APPROVAL_SLA_HOURS",
        Number(settingForm.approvalHours),
        approvalToken,
      );
      const serviceDayToken = await accountService.reauthenticate(configurationPassword);
      return adminService.updatePlatformSetting(
        "MIN_SUBSCRIPTION_SERVICE_DAYS",
        Number(settingForm.minimumServiceDays),
        serviceDayToken,
      );
    },
    onSuccess: (values) => {
      queryClient.setQueryData(["admin-platform-settings"], values);
      setConfigurationPassword("");
    },
  });
  const downloadStatement = async (item: AdminPayout) => {
    const blob = await adminService.getPayoutStatement(item.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hak-edis-${item.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const availableRefund = payment
    ? payment.grossAmount - payment.refundedAmount
    : 0;
  const changeTab = (value: typeof tab) => setTab(value);
  const financeTabs: {
    value: typeof tab;
    label: string;
    icon: typeof WalletCards;
  }[] = [
    { value: "payments", label: "Tahsilatlar", icon: WalletCards },
    { value: "refunds", label: "İadeler", icon: WalletCards },
    { value: "disputes", label: "Uyuşmazlıklar", icon: WalletCards },
    { value: "payouts", label: "Hakedişler", icon: Landmark },
    { value: "configuration", label: "Platform ayarları", icon: Settings },
  ];
  const visiblePayments = (payments.data?.content || []).filter((item) =>
    tab === "refunds"
      ? item.refundedAmount > 0
      : tab === "disputes"
        ? item.status === "FAILED" || !!item.failureMessage
        : true,
  );
  return (
    <div className="mf-page space-y-6">
      <PageHeader
        eyebrow="Finans merkezi"
        title="Ödeme ve hakedişler"
        description="Tahsilat, iade, komisyon ve satıcı hakedişlerini güvenli biçimde yönetin."
      />
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {financeTabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              onClick={() => changeTab(item.value)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === item.value ? "border-primary-600 text-primary-700" : "border-transparent text-slate-500"}`}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </div>
      {tab !== "payouts" && tab !== "configuration" && (
        <>
          {payments.isError ? (
            <EmptyState
              title="Ödemeler yüklenemedi"
              description="Bağlantıyı kontrol edip tekrar deneyin."
              action={
                <Button
                  onClick={() => payments.refetch()}
                  variant="outline"
                  size="sm"
                >
                  Tekrar dene
                </Button>
              }
            />
          ) : (
            <>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setAppliedSearch(search);
                }}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:max-w-2xl"
              >
                <label className="relative flex-1">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Müşteri veya mağaza ara"
                    className="mf-input w-full pl-9"
                  />
                </label>
                <Button type="submit">Ara</Button>
              </form>
              <div className="mf-surface mt-4 overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Ödeme</th>
                      <th className="px-4 py-3">Müşteri</th>
                      <th className="px-4 py-3">Mağaza</th>
                      <th className="px-4 py-3">Brüt / Komisyon / Net</th>
                      <th className="px-4 py-3">İade</th>
                      <th className="px-4 py-3">Durum</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.isLoading && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-10 text-center text-slate-500"
                        >
                          Ödemeler yükleniyor…
                        </td>
                      </tr>
                    )}
                    {visiblePayments.map((item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3 font-bold">
                          #{item.id}
                          <div className="mt-1 text-xs font-normal text-slate-500">
                            Abonelik #{item.subscriptionId}
                          </div>
                        </td>
                        <td className="px-4 py-3">{item.customerName}</td>
                        <td className="px-4 py-3">{item.storeName}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">
                            {money(item.grossAmount)}
                          </div>
                          <div className="text-xs text-slate-500">
                            Komisyon: {money(item.commissionAmount)} · Net:{" "}
                            {money(item.netAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {money(item.refundedAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            tone={uiStatus(paymentStatuses, item.status).tone}
                          >
                            {uiStatus(paymentStatuses, item.status).label}
                          </StatusBadge>
                          {item.failureMessage && (
                            <div className="mt-1 text-xs text-danger-600">
                              {item.failureMessage}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            disabled={
                              !["SUCCEEDED", "PARTIALLY_REFUNDED"].includes(
                                item.status,
                              )
                            }
                            onClick={() => {
                              setPayment(item);
                              setAmount(
                                String(item.grossAmount - item.refundedAmount),
                              );
                              setReason("");
                            }}
                            variant="outline"
                            size="sm"
                          >
                            İade
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!payments.isLoading && visiblePayments.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-10 text-center text-slate-500"
                        >
                          Bu görünümde ödeme bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
      {tab === "payouts" &&
        (payouts.isError ? (
          <EmptyState
            title="Hakedişler yüklenemedi"
            description="Bağlantıyı kontrol edip tekrar deneyin."
            action={
              <Button
                onClick={() => payouts.refetch()}
                variant="outline"
                size="sm"
              >
                Tekrar dene
              </Button>
            }
          />
        ) : (
          <div className="mf-surface overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mağaza</th>
                  <th className="px-4 py-3">Dönem</th>
                  <th className="px-4 py-3">Brüt</th>
                  <th className="px-4 py-3">Komisyon</th>
                  <th className="px-4 py-3">İade</th>
                  <th className="px-4 py-3">Mahsup</th>
                  <th className="px-4 py-3">Net hakediş</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.isLoading && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-500">
                      Hakedişler yükleniyor…
                    </td>
                  </tr>
                )}
                {payouts.data?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-bold">{item.storeName}</td>
                    <td className="px-4 py-3">
                      {item.periodStart} – {item.periodEnd}
                    </td>
                    <td className="px-4 py-3">{money(item.grossAmount)}</td>
                    <td className="px-4 py-3">
                      {money(item.commissionAmount)}
                    </td>
                    <td className="px-4 py-3">{money(item.refundAmount)}</td>
                    <td className="px-4 py-3">{money(item.adjustmentAmount)}</td>
                    <td className="px-4 py-3 font-black">
                      {money(item.netAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={uiStatus(payoutStatuses, item.status).tone}
                      >
                        {uiStatus(payoutStatuses, item.status).label}
                      </StatusBadge>
                      {item.providerPayoutId && (
                        <div className="mt-1 max-w-40 truncate text-xs text-slate-500">
                          {item.providerPayoutId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === "PAID" && (
                          <Button
                            onClick={() => void downloadStatement(item)}
                            variant="outline"
                            size="sm"
                          >
                            Belge
                          </Button>
                        )}
                        {["SCHEDULED", "TRANSFER_FAILED"].includes(
                          item.status,
                        ) && (
                          <Button
                            disabled={
                              !!item.scheduledAt &&
                              new Date(item.scheduledAt).getTime() > Date.now()
                            }
                            title={
                              item.scheduledAt &&
                              new Date(item.scheduledAt).getTime() > Date.now()
                                ? "Planlanan ödeme zamanı henüz gelmedi"
                                : undefined
                            }
                            onClick={() => {
                              setPayoutToPay(item);
                              setPayoutPassword("");
                            }}
                            size="sm"
                          >
                            {item.status === "TRANSFER_FAILED"
                              ? "Tekrar dene"
                              : "Öde"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!payouts.isLoading && !payouts.data?.length && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-500">
                      Hakediş bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      {tab === "configuration" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="mf-surface p-6">
            <h2 className="text-lg font-black">Platform kuralları</h2>
            <p className="mt-1 text-sm text-slate-500">
              Değişiklikler yalnız yeni abonelik taleplerine uygulanır.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="mf-label">
                Satıcı onay süresi (saat)
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={settingForm.approvalHours}
                  onChange={(event) =>
                    setSettingForm({
                      ...settingForm,
                      approvalHours: event.target.value,
                    })
                  }
                  className="mf-input mt-2 w-full"
                />
              </label>
              <label className="mf-label">
                Minimum hizmet günü
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={settingForm.minimumServiceDays}
                  onChange={(event) =>
                    setSettingForm({
                      ...settingForm,
                      minimumServiceDays: event.target.value,
                    })
                  }
                  className="mf-input mt-2 w-full"
                />
              </label>
            </div>
            {platformSettings.data && (
              <p className="mt-3 text-xs text-slate-500">
                Kayıtlı: {platformSettings.data.SUBSCRIPTION_APPROVAL_SLA_HOURS}
                {" saat · "}
                {platformSettings.data.MIN_SUBSCRIPTION_SERVICE_DAYS} hizmet günü
              </p>
            )}
            <Button
              className="mt-4"
              disabled={!configurationPassword || saveSettings.isPending}
              onClick={() => saveSettings.mutate()}
            >
              Kuralları kaydet
            </Button>
          </section>
          <section className="mf-surface p-6">
            <h2 className="text-lg font-black">Yeni komisyon kuralı</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mağaza boş bırakılırsa oran tüm mağazalar için geçerlidir.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="mf-label">
                Mağaza no (isteğe bağlı)
                <input
                  type="number"
                  min={1}
                  value={commissionForm.storeId}
                  onChange={(event) =>
                    setCommissionForm({ ...commissionForm, storeId: event.target.value })
                  }
                  className="mf-input mt-2 w-full"
                />
              </label>
              <label className="mf-label">
                Geçerlilik başlangıcı
                <input
                  type="date"
                  value={commissionForm.effectiveFrom}
                  onChange={(event) =>
                    setCommissionForm({ ...commissionForm, effectiveFrom: event.target.value })
                  }
                  className="mf-input mt-2 w-full"
                />
              </label>
              <label className="mf-label">
                Komisyon (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={commissionForm.commissionPercent}
                  onChange={(event) => setCommissionForm({ ...commissionForm, commissionPercent: event.target.value })}
                  className="mf-input mt-2 w-full"
                />
              </label>
              <label className="mf-label">
                Komisyon KDV (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={commissionForm.vatPercent}
                  onChange={(event) => setCommissionForm({ ...commissionForm, vatPercent: event.target.value })}
                  className="mf-input mt-2 w-full"
                />
              </label>
            </div>
            <label className="mf-label mt-4 block">
              İşlem şifreniz
              <input
                type="password"
                value={configurationPassword}
                onChange={(event) => setConfigurationPassword(event.target.value)}
                autoComplete="current-password"
                className="mf-input mt-2 w-full"
              />
            </label>
            <Button
              className="mt-4"
              disabled={!configurationPassword || !commissionForm.effectiveFrom || saveCommission.isPending}
              onClick={() => saveCommission.mutate()}
            >
              Komisyon kuralını ekle
            </Button>
            {(saveCommission.isError || saveSettings.isError) && (
              <p className="mt-3 text-sm text-danger-600">
                Ayar kaydedilemedi. Şifreyi ve değer aralıklarını kontrol edin.
              </p>
            )}
          </section>
          <section className="mf-surface overflow-x-auto p-6 xl:col-span-2">
            <h2 className="text-lg font-black">Komisyon geçmişi</h2>
            <table className="mt-4 w-full min-w-[700px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3">Kapsam</th><th>Komisyon</th><th>KDV</th>
                  <th>Başlangıç</th><th>Bitiş</th><th>Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissionRules.data?.map((rule) => (
                  <tr key={rule.id}>
                    <td className="py-3 font-bold">{rule.storeName}</td>
                    <td>%{(rule.commissionRate * 100).toLocaleString("tr-TR")}</td>
                    <td>%{(rule.commissionVatRate * 100).toLocaleString("tr-TR")}</td>
                    <td>{rule.effectiveFrom}</td><td>{rule.effectiveTo || "–"}</td>
                    <td>{rule.active ? "Aktif" : "Geçmiş"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
      {payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black">Ödeme iadesi</h2>
            <p className="mt-1 text-sm text-slate-500">
              İade edilebilir tutar: {money(availableRefund)}
            </p>
            <label className="mf-label mt-4 block">
              İade tutarı
              <input
                type="number"
                min="0.01"
                max={availableRefund}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mf-input mt-2 w-full"
              />
            </label>
            <label className="mf-label mt-3 block">
              Gerekçe
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                className="mf-textarea mt-2 min-h-20 w-full"
              />
            </label>
            <label className="mf-label mt-3 block">
              İşlem şifreniz
              <input
                type="password"
                value={reauthPassword}
                onChange={(event) => setReauthPassword(event.target.value)}
                autoComplete="current-password"
                className="mf-input mt-2 w-full"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                İade başlatmak için 10 dakika geçerli doğrulama oluşturur.
              </span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                onClick={() => setPayment(null)}
                variant="ghost"
                size="sm"
              >
                Vazgeç
              </Button>
              <Button
                disabled={
                  !reason.trim() ||
                  !reauthPassword ||
                  Number(amount) <= 0 ||
                  Number(amount) > availableRefund
                }
                onClick={() => setConfirmOpen(true)}
                variant="danger"
                size="sm"
              >
                İadeyi incele
              </Button>
            </div>
            {refund.isError && (
              <p className="mt-3 text-sm text-danger-600">
                Şifre doğrulanamadı veya iade başlatılamadı.
              </p>
            )}
          </section>
        </div>
      )}
      {payoutToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-black">Hakedişi öde</h2>
            <p className="mt-1 text-sm text-slate-500">
              {payoutToPay.storeName} için {money(payoutToPay.netAmount)} banka
              aktarımına gönderilecek. Bu işlem ikinci kez çalıştırılamaz.
            </p>
            <label className="mf-label mt-4 block">
              İşlem şifreniz
              <input
                type="password"
                value={payoutPassword}
                onChange={(event) => setPayoutPassword(event.target.value)}
                autoComplete="current-password"
                className="mf-input mt-2 w-full"
              />
            </label>
            {payPayout.isError && (
              <p className="mt-3 text-sm text-danger-600">
                Şifre doğrulanamadı, IBAN eksik veya aktarım başlatılamadı.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                onClick={() => setPayoutToPay(null)}
                variant="ghost"
                size="sm"
              >
                Vazgeç
              </Button>
              <Button
                disabled={!payoutPassword || payPayout.isPending}
                onClick={() => payPayout.mutate()}
                size="sm"
              >
                {payPayout.isPending ? "Gönderiliyor…" : "Ödemeyi gönder"}
              </Button>
            </div>
          </section>
        </div>
      )}
      <ConfirmModal
        open={confirmOpen}
        title="İade başlat"
        message={`${amount} TL tutarındaki iade sağlayıcıya iletilecek ve işlem kaydı oluşturulacak.`}
        confirmLabel="İadeyi başlat"
        danger
        pending={refund.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => refund.mutate()}
      />
    </div>
  );
}
