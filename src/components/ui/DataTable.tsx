import type { ReactNode } from "react";
type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};
type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string | number;
  emptyMessage?: string;
};
export default function DataTable<T>({
  columns,
  rows,
  getKey,
  emptyMessage = "Gösterilecek kayıt bulunamadı.",
}: Props<T>) {
  return (
    <div className="mf-surface overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-[#e6e1d8] bg-[#f7f4ee] text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 ${column.className || ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eeeae2]">
          {rows.length ? (
            rows.map((row) => (
              <tr key={getKey(row)} className="transition hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${column.className || ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
