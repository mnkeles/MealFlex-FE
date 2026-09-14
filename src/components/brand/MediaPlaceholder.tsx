import { Image as ImageIcon, Store, UserRound } from "lucide-react";
import { useState } from "react";

type MediaKind = "store" | "menu" | "user";
type MediaPlaceholderProps = {
  src?: string | null;
  alt: string;
  kind: MediaKind;
  className?: string;
  imageClassName?: string;
  fallbackLabel?: string;
  fit?: "cover" | "contain";
};

const icons = { store: Store, menu: ImageIcon, user: UserRound };
const gradients = {
  store: "from-primary-100 via-cream to-accent-100 text-primary-700",
  menu: "from-accent-100 via-cream to-natural-100 text-accent-700",
  user: "from-slate-100 to-primary-50 text-slate-600",
};

/** Bozuk veya eksik görsellerde de tutarlı oran ve anlamlı bir varsayılan sunar. */
export default function MediaPlaceholder({
  src,
  alt,
  kind,
  className = "",
  imageClassName = "",
  fallbackLabel,
  fit = "cover",
}: MediaPlaceholderProps) {
  const [failed, setFailed] = useState(false);
  const Icon = icons[kind];
  const initials = fallbackLabel
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
  if (src && !failed)
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${imageClassName}`}
      />
    );
  return (
    <span
      className={`grid h-full w-full place-items-center bg-gradient-to-br ${gradients[kind]} ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
    >
      {kind === "store" && initials ? (
        <span className="text-[0.72em] font-black tracking-tight" aria-hidden="true">
          {initials}
        </span>
      ) : (
        <Icon className="h-1/3 w-1/3 min-h-4 min-w-4" aria-hidden="true" />
      )}
    </span>
  );
}
