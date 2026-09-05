import { useId } from "react";

type MealFlexLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  surface?: "light" | "dark";
};

export default function MealFlexLogo({
  className = "",
  iconClassName = "h-9 w-9",
  wordmarkClassName,
  showWordmark = true,
  surface = "light",
}: MealFlexLogoProps) {
  const gradientId = `mealflex-brand-gradient-${useId().replace(/:/g, "")}`;
  const highlightId = `mealflex-brand-highlight-${useId().replace(/:/g, "")}`;
  const resolvedWordmarkClassName =
    wordmarkClassName || "text-xl font-black tracking-[-0.045em]";

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="MealFlex"
    >
      <svg
        viewBox="0 0 56 56"
        role="img"
        aria-hidden="true"
        className={`${iconClassName} shrink-0 drop-shadow-[0_5px_10px_rgba(146,34,24,0.18)]`}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="8"
            y1="5"
            x2="48"
            y2="51"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f24b3b" />
            <stop offset="0.55" stopColor="#df3527" />
            <stop offset="1" stopColor="#b92319" />
          </linearGradient>
          <linearGradient
            id={highlightId}
            x1="15"
            y1="10"
            x2="40"
            y2="47"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#fff3e7" />
          </linearGradient>
        </defs>

        <rect width="56" height="56" rx="17" fill={`url(#${gradientId})`} />
        <path
          d="M10.5 18.5c3.4-7 10.1-11 18-11 8.9 0 15.1 4.8 18 10.4"
          fill="none"
          stroke="white"
          strokeOpacity=".14"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <path
          d="M14 35.5c1.8 6.3 7 10 14 10s12.2-3.7 14-10H14Z"
          fill={`url(#${highlightId})`}
        />
        <path
          d="M12.5 33.5h31"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M17 29V17.8c0-.8.6-1.4 1.4-1.4h.9c.6 0 1.1.3 1.4.7L28 27.3l7.3-10.2c.3-.4.8-.7 1.4-.7h.9c.8 0 1.4.6 1.4 1.4V29h-4.5v-5.8L28 32l-6.5-8.8V29H17Z"
          fill={`url(#${highlightId})`}
        />
        <circle cx="43" cy="14" r="2.4" fill="#ffd277" />
      </svg>

      {showWordmark && (
        <span
          className={`${resolvedWordmarkClassName} inline-flex items-baseline leading-none`}
        >
          <span className={surface === "dark" ? "text-white" : "text-slate-950"}>
            Meal
          </span>
          <span className={surface === "dark" ? "text-red-200" : "text-primary-600"}>
            Flex
          </span>
        </span>
      )}
    </span>
  );
}
