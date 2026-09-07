import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import ConfirmModal from "@/components/common/ConfirmModal";

const roles = [
  {
    value: "STORE_MANAGER",
    label: "Mağaza yöneticisi",
    permissions: ["Operasyon", "Menü", "Personel"],
  },
  {
    value: "OPERATIONS",
    label: "Operasyon",
    permissions: ["Teslimatlar", "Abonelik talepleri"],
  },
  {
    value: "KITCHEN",
    label: "Mutfak",
    permissions: ["Üretim planı", "Menü görüntüleme"],
  },
  { value: "COURIER", label: "Kurye", permissions: ["Atanan teslimatlar"] },
  {
    value: "FINANCE",
    label: "Finans",
    permissions: ["Hakedişler", "Raporlar"],
  },
];
const statusLabel: Record<string, string> = {
  INVITED: "Davet bekliyor",
  ACTIVE: "Aktif",
  DEACTIVATED: "Pasif",
};

export default function StoreStaffPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("OPERATIONS");
  const [pendingDeactivate, setPendingDeactivate] = useState<number>();
  const [invitationLink, setInvitationLink] = useState("");
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["store-staff", storeId],
    queryFn: () => sellerService.getStoreStaff(storeId),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["store-staff", storeId] });
  const invite = useMutation({
    mutationFn: () => sellerService.inviteStoreStaff(storeId, email, role),
    onSuccess: (member) => {
      setEmail("");
      setInvitationLink(
        member.invitationToken
          ? `${window.location.origin}/staff/invitations/accept?token=${encodeURIComponent(member.invitationToken)}`
          : "",
      );
      refresh();
    },
  });
  const deactivate = useMutation({
    mutationFn: (id: number) => sellerService.deactivateStoreStaff(storeId, id),
    onSuccess: () => {
      setPendingDeactivate(undefined);
      refresh();
    },
  });
  const selectedRole = roles.find((item) => item.value === role) || roles[1];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Personel ve yetkiler</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rol seçimi, verilebilecek temel erişimleri aşağıda açıkça gösterir.
        </p>
      </div>
      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            invite.mutate();
          }}
          className="rounded-xl bg-white p-4 shadow-sm"
        >
          <h3 className="font-medium">Personel davet et</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="personel@firma.com"
              className="min-w-52 flex-1 rounded-lg border px-3 py-2"
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="rounded-lg border px-3 py-2"
            >
              {roles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
              disabled={invite.isPending}
            >
              Davet et
            </button>
          </div>
          {invite.isError && (
            <p className="mt-3 text-sm text-danger-700">
              Davet oluşturulamadı.
            </p>
          )}
          {invitationLink && (
            <div className="mt-3 rounded-xl border border-success-200 bg-success-50 p-3 text-sm text-success-900">
              <p className="font-bold">Davet bağlantısı yalnız bir kez gösterilir.</p>
              <p className="mt-1 break-all text-xs">{invitationLink}</p>
              <button
                type="button"
                className="mt-2 rounded-lg border border-success-300 bg-white px-3 py-1.5 text-xs font-bold"
                onClick={() => navigator.clipboard.writeText(invitationLink)}
              >
                Bağlantıyı kopyala
              </button>
            </div>
          )}
        </form>
        <aside className="rounded-xl border border-primary-100 bg-primary-50 p-4">
          <h3 className="font-medium text-primary-900">
            {selectedRole.label} izinleri
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {selectedRole.permissions.map((permission) => (
              <li
                key={permission}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-800"
              >
                {permission}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-primary-800">
            Rol değişikliği yapıldığında izinler bu matrise göre güncellenir.
          </p>
        </aside>
      </section>
      {isLoading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] gap-4 border-b bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500 md:grid">
            <span>Personel</span>
            <span>Rol ve izinler</span>
            <span>Durum</span>
          </div>
          {staff.map((member) => (
            <div
              className="grid gap-3 border-b p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
              key={member.id}
            >
              <div>
                <p className="font-medium text-sm">
                  {member.fullName || member.email}
                </p>
                <p className="text-sm text-slate-500">{member.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {roles.find((item) => item.value === member.role)?.label ||
                    member.role}
                </p>
                <p className="mt-1 max-w-72 text-xs text-slate-500">
                  {member.permissions.join(", ") || "Rolün varsayılan izinleri"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${member.status === "ACTIVE" ? "bg-success-50 text-success-700" : member.status === "INVITED" ? "bg-warning-50 text-warning-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {statusLabel[member.status] || member.status}
                </span>
                {member.status !== "DEACTIVATED" && (
                  <button
                    type="button"
                    onClick={() => setPendingDeactivate(member.id)}
                    className="text-xs font-medium text-danger-700"
                  >
                    Erişimi kapat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        open={!!pendingDeactivate}
        title="Personel erişimini kapat"
        message="Bu kişi mağaza araçlarına erişemez. Daha sonra tekrar davet edebilirsiniz."
        confirmLabel="Erişimi kapat"
        danger
        pending={deactivate.isPending}
        onClose={() => setPendingDeactivate(undefined)}
        onConfirm={() =>
          pendingDeactivate && deactivate.mutate(pendingDeactivate)
        }
      />
    </div>
  );
}
