import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sellerService } from "@/services/sellerService";
import ConfirmModal from "@/components/common/ConfirmModal";
import StatusBadge from "@/components/ui/StatusBadge";

const documentTypes = [
  { value: "TRADE_REGISTRY", label: "Ticaret Sicil Belgesi" },
  { value: "TAX_CERTIFICATE", label: "Vergi Levhası" },
  { value: "FOOD_LICENSE", label: "Gıda Üretim İzni" },
  { value: "HYGIENE_CERTIFICATE", label: "Hijyen Sertifikası" },
  { value: "HEALTH_CERTIFICATE", label: "Sağlık Belgesi" },
  { value: "OTHER", label: "Diğer" },
];
const label = (type: string) =>
  documentTypes.find((item) => item.value === type)?.label || type;

export default function StoreDocumentsPage() {
  const { storeId } = useOutletContext<{ storeId: number }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number>();
  const [form, setForm] = useState({
    documentType: "TRADE_REGISTRY",
    expiryDate: "",
    file: null as File | null,
  });
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["store-documents", storeId],
    queryFn: () => sellerService.getDocuments(storeId),
    enabled: !!storeId,
  });
  const { data: onboarding } = useQuery({
    queryKey: ["store-onboarding", storeId],
    queryFn: () => sellerService.getStoreOnboarding(storeId),
    enabled: !!storeId,
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["store-documents", storeId] });
    queryClient.invalidateQueries({ queryKey: ["store-onboarding", storeId] });
  };
  const addMutation = useMutation({
    mutationFn: () =>
      sellerService.addDocument(storeId, {
        documentType: form.documentType,
        expiryDate: form.expiryDate || undefined,
        file: form.file!,
      }),
    onSuccess: () => {
      refresh();
      setShowForm(false);
      setForm({ documentType: "TRADE_REGISTRY", expiryDate: "", file: null });
    },
  });
  const contractMutation = useMutation({
    mutationFn: () => sellerService.acceptStoreContract(storeId),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: (documentId: number) =>
      sellerService.deleteDocument(storeId, documentId),
    onSuccess: () => {
      refresh();
      setPendingDeleteId(undefined);
    },
  });
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.file) addMutation.mutate();
  };
  const progress = onboarding
    ? Math.round((onboarding.completedSteps / onboarding.totalSteps) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Belgeler ve mağaza onayı</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showForm ? "İptal" : "+ Belge Yükle"}
        </button>
      </div>
      {onboarding && (
        <section className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex justify-between gap-4">
            <div>
              <h3 className="font-medium">Yayın hazırlığı</h3>
              <p className="text-sm text-slate-500 mt-1">
                {onboarding.readyForPublication
                  ? "Mağazanız yayın için hazır."
                  : onboarding.publicationBlockReason}
              </p>
            </div>
            <span className="text-sm font-semibold">
              {onboarding.completedSteps}/{onboarding.totalSteps}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-primary-600"
              style={{ width: `${progress}%` }}
            />
          </div>
          {!onboarding.contractAccepted && (
            <div className="mt-4 rounded-lg bg-warning-50 p-3 text-sm text-warning-800">
              <p>Mağaza sözleşmesini okuyup dijital olarak onaylamalısınız.</p>
              <button
                onClick={() => contractMutation.mutate()}
                disabled={contractMutation.isPending}
                className="mt-2 text-primary-700 font-medium"
              >
                Sözleşmeyi onaylıyorum
              </button>
            </div>
          )}
          {onboarding.missingDocumentTypes.length > 0 && (
            <p className="mt-3 text-sm text-danger-600">
              Eksik/onaysız belgeler:{" "}
              {onboarding.missingDocumentTypes.map(label).join(", ")}
            </p>
          )}
          {onboarding.expiringDocumentTypes.length > 0 && (
            <p className="mt-2 text-sm text-warning-700">
              30 gün içinde süresi dolacak:{" "}
              {onboarding.expiringDocumentTypes.map(label).join(", ")}
            </p>
          )}
        </section>
      )}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label className="text-sm font-medium">
              Belge tipi
              <select
                value={form.documentType}
                onChange={(e) =>
                  setForm({ ...form, documentType: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Dosya (PDF, JPG veya PNG; en fazla 10 MB)
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                required
                onChange={(e) =>
                  setForm({ ...form, file: e.target.files?.[0] || null })
                }
                className="w-full mt-1 text-sm"
              />
            </label>
            <label className="text-sm font-medium">
              Son geçerlilik tarihi (varsa)
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={!form.file || addMutation.isPending}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {addMutation.isPending ? "Yükleniyor..." : "Belgeyi yükle"}
          </button>
          {addMutation.isError && (
            <p className="text-sm text-danger-600 mt-2">
              Belge yüklenemedi. Dosya türünü ve boyutunu kontrol edin.
            </p>
          )}
        </form>
      )}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-slate-500">
          Henüz belge yüklenmemiş.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex gap-2 items-center">
                  <h3 className="text-sm font-medium">
                    {label(doc.documentType)}
                  </h3>
                  <StatusBadge
                    domain="document"
                    status={doc.verificationStatus}
                  />
                </div>
                <p className="text-sm text-slate-500">{doc.fileName}</p>
                {doc.expiryDate && (
                  <p className="text-xs text-slate-400">
                    Son geçerlilik: {doc.expiryDate}
                  </p>
                )}
                {doc.rejectionReason && (
                  <p className="text-xs text-danger-600 mt-1">
                    Ret nedeni: {doc.rejectionReason}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg"
                >
                  Görüntüle
                </a>
                <button
                  onClick={() => setPendingDeleteId(doc.id)}
                  className="text-xs px-3 py-1.5 bg-danger-50 text-danger-600 rounded-lg"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        open={!!pendingDeleteId}
        title="Belgeyi sil"
        message="Bu belge silinecek. Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger
        pending={deleteMutation.isPending}
        onClose={() => setPendingDeleteId(undefined)}
        onConfirm={() =>
          pendingDeleteId && deleteMutation.mutate(pendingDeleteId)
        }
      />
    </div>
  );
}
