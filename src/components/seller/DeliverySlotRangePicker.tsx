import { useState } from "react";

const deliveryTimeOptions = Array.from({ length: 96 }, (_, index) => {
  const hour = String(Math.floor(index / 4)).padStart(2, "0");
  const minute = String((index % 4) * 15).padStart(2, "0");
  return `${hour}:${minute}`;
});

type DeliverySlotRangePickerProps = {
  value: string[];
  onChange: (slots: string[]) => void;
  disabled?: boolean;
  onDirty?: () => void;
};

export default function DeliverySlotRangePicker({
  value,
  onChange,
  disabled = false,
  onDirty,
}: DeliverySlotRangePickerProps) {
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("14:00");
  const [error, setError] = useState("");

  const addRange = () => {
    const startIndex = deliveryTimeOptions.indexOf(start);
    const endIndex = deliveryTimeOptions.indexOf(end);
    if (endIndex < startIndex) {
      setError("Bitiş saati başlangıç saatinden önce olamaz.");
      return;
    }
    setError("");
    onDirty?.();
    onChange(
      [...new Set([...value, ...deliveryTimeOptions.slice(startIndex, endIndex + 1)])].sort(),
    );
  };

  const remove = (time: string) => {
    setError("");
    onDirty?.();
    onChange(value.filter((slot) => slot !== time));
  };

  return (
    <fieldset disabled={disabled}>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block text-sm font-medium text-slate-700">
          Başlangıç saati
          <select value={start} onChange={(event) => setStart(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            {deliveryTimeOptions.map((time) => <option key={time}>{time}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Bitiş saati
          <select value={end} onChange={(event) => setEnd(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            {deliveryTimeOptions.map((time) => <option key={time}>{time}</option>)}
          </select>
        </label>
        <button type="button" onClick={addRange} className="rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50">
          Aralığı ekle
        </button>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Başlangıç ve bitiş dahil, aradaki saatler 15 dakikalık dilimlerle eklenir.
        Birden fazla aralık ekleyebilirsiniz.
      </p>
      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">Müşteriye sunulacak saatler</p>
        {value.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {value.map((time) => (
              <span key={time} className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-800">
                {time}
                <button type="button" onClick={() => remove(time)} aria-label={`${time} teslimat saatini kaldır`} className="text-primary-700 hover:text-danger-600">×</button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-danger-600">En az bir teslimat saati tanımlamalısınız.</p>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-danger-600">{error}</p>}
    </fieldset>
  );
}
