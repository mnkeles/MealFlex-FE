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
    "bg-[#191919] text-white hover:bg-[#333333] focus:ring-slate-200",
  outline:
    "border border-[#d6d6d6] bg-white text-[#191919] hover:border-[#a8a8a8] hover:bg-[#f7f7f7] focus:ring-slate-100",
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
      className={`inline-flex items-center justify-center rounded-xl font-bold transition focus:outline-none focus:ring-4 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}
