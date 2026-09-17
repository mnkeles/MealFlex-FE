import { ImagePlus } from "lucide-react";
type Props = {
  onFiles: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  label?: string;
  hint?: string;
  disabled?: boolean;
};
export default function FileUpload({
  onFiles,
  accept = "image/jpeg,image/png,image/webp",
  maxFiles = 10,
  label = "Dosya ekle",
  hint,
  disabled,
}: Props) {
  return (
    <label
      className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#cfc6b9] bg-[#faf8f4] p-5 text-center transition hover:border-primary-300 hover:bg-primary-50/40 ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <ImagePlus className="text-primary-600" size={26} />
      <span className="mt-2 text-sm font-semibold text-primary-700">{label}</span>
      <span className="mt-1 text-xs text-slate-500">
        {hint || `En fazla ${maxFiles} dosya seçebilirsiniz.`}
      </span>
      <input
        className="sr-only"
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        disabled={disabled}
        onChange={(event) => {
          onFiles(Array.from(event.target.files || []).slice(0, maxFiles));
          event.target.value = "";
        }}
      />
    </label>
  );
}
