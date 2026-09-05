import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

type BaseProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children?: ReactNode;
};
type InputProps = BaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    startAdornment?: ReactNode;
    endAdornment?: ReactNode;
  };
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export const FormField = forwardRef<HTMLInputElement, InputProps>(function FormField({
  label,
  hint,
  error,
  required,
  id,
  children,
  startAdornment,
  endAdornment,
  ...props
}, ref) {
  const fieldId =
    id ||
    `field-${label.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="block">
      <label htmlFor={fieldId} className="mf-label">
        {label}
        {required && <span className="ml-1 text-danger-600">*</span>}
      </label>
      {children || (
        <span className="relative mt-2 block">
          {startAdornment && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              {startAdornment}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
            }
            className={`mf-input w-full ${startAdornment ? "pl-10" : ""} ${endAdornment ? "pr-11" : ""} ${error ? "border-danger-500 focus:border-danger-500" : ""}`}
            {...props}
          />
          {endAdornment && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
              {endAdornment}
            </span>
          )}
        </span>
      )}
      {hint && !error && (
        <span
          id={`${fieldId}-hint`}
          className="mt-1 block text-xs text-slate-500"
        >
          {hint}
        </span>
      )}
      {error && (
        <span
          id={`${fieldId}-error`}
          role="alert"
          className="mt-1 block text-xs font-semibold text-danger-600"
        >
          {error}
        </span>
      )}
    </div>
  );
});

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaProps>(function TextareaField({
  label,
  hint,
  error,
  required,
  id,
  ...props
}, ref) {
  const fieldId =
    id ||
    `field-${label.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label htmlFor={fieldId} className="block">
      <span className="mf-label">
        {label}
        {required && <span className="ml-1 text-danger-600">*</span>}
      </span>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
        }
        className={`mf-textarea mt-2 w-full ${error ? "border-danger-500 focus:border-danger-500" : ""}`}
        {...props}
      />
      {hint && !error && (
        <span
          id={`${fieldId}-hint`}
          className="mt-1 block text-xs text-slate-500"
        >
          {hint}
        </span>
      )}
      {error && (
        <span
          id={`${fieldId}-error`}
          role="alert"
          className="mt-1 block text-xs font-semibold text-danger-600"
        >
          {error}
        </span>
      )}
    </label>
  );
});
