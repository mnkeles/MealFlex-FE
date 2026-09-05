import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
type Item = { label: string; to?: string };
export default function Breadcrumb({ items }: { items: Item[] }) {
  return (
    <nav aria-label="Sayfa yolu">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {items.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-center gap-1"
          >
            {index > 0 && <ChevronRight size={15} aria-hidden="true" />}
            {item.to && index < items.length - 1 ? (
              <Link
                className="font-semibold hover:text-primary-700"
                to={item.to}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  index === items.length - 1
                    ? "font-semibold text-slate-700"
                    : ""
                }
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
