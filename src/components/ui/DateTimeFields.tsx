type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  required?: boolean;
  disabled?: boolean;
};
export function DateField({
  label,
  value,
  onChange,
  min,
  required,
  disabled,
}: DateFieldProps) {
  return (
    <label className="block">
      <span className="mf-label">
        {label}
        {required && <span className="ml-1 text-danger-600">*</span>}
      </span>
      <input
        type="date"
        value={value}
        min={min}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mf-input mt-2 w-full"
      />
    </label>
  );
}
export function TimeField({
  label,
  value,
  onChange,
  required,
  disabled,
}: Omit<DateFieldProps, "min">) {
  return (
    <label className="block">
      <span className="mf-label">
        {label}
        {required && <span className="ml-1 text-danger-600">*</span>}
      </span>
      <input
        type="time"
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mf-input mt-2 w-full"
      />
    </label>
  );
}
