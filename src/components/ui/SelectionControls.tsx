import type { ReactNode } from "react";

type Choice = {
  value: string;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
};
type ChoiceGroupProps = {
  options: Choice[];
  value: string;
  onChange: (value: string) => void;
  label: string;
};
export function RadioGroup({
  options,
  value,
  onChange,
  label,
}: ChoiceGroupProps) {
  return (
    <fieldset>
      <legend className="mf-label">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${value === option.value ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500" : "border-[#e7e7e7] hover:border-[#bdbdbd]"} ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <input
              className="mt-0.5"
              type="radio"
              name={label}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            <span>
              <span className="block text-sm font-bold text-ink">
                {option.label}
              </span>
              {option.description && (
                <span className="mt-1 block text-xs text-slate-500">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 rounded-2xl border border-[#e7e7e7] p-4 ${disabled ? "opacity-50" : ""}`}
    >
      <span>
        <span className="block text-sm font-bold text-ink">{label}</span>
        {description && (
          <span className="mt-1 block text-xs text-slate-500">
            {description}
          </span>
        )}
      </span>
      <input
        className="h-5 w-5 accent-primary-600"
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
      />
    </label>
  );
}
export function SegmentControl({
  options,
  value,
  onChange,
  label,
}: ChoiceGroupProps) {
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="inline-flex rounded-full bg-[#f2f2f2] p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${value === option.value ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-ink"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
