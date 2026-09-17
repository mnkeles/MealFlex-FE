import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-200",
  secondary:
    "bg-[#263b32] text-white hover:bg-[#1b3028] focus:ring-success-200",
  outline:
    "border border-[#dedbd3] bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-100",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-100",
  danger:
    "bg-danger-600 text-white shadow-sm hover:bg-danger-700 focus:ring-danger-100",
};

const sizes: Record<Size, string> = {
  sm: "h-9 gap-1.5 px-3 text-xs",
  md: "h-11 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition focus:outline-none focus:ring-4 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}
