import { cn } from "@/lib/utils";

interface BrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const sizes = {
  sm: { box: "h-8 w-8", icon: 18, text: "text-base" },
  md: { box: "h-10 w-10", icon: 22, text: "text-lg" },
  lg: { box: "h-12 w-12", icon: 26, text: "text-xl" },
  xl: { box: "h-16 w-16", icon: 34, text: "text-2xl" },
};

export function BrandMark({ size = "md", className }: { size?: BrandProps["size"]; className?: string }) {
  const s = sizes[size];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30",
        s.box,
        className
      )}
    >
      <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Croix médicale stylisée */}
        <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" fill="currentColor" opacity="0.95" />
        <circle cx="12" cy="12" r="2.2" fill="oklch(0.99 0.01 165)" />
      </svg>
    </div>
  );
}

export function Brand({ size = "md", showText = true, className, textClassName }: BrandProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-bold tracking-tight", s.text, textClassName)}>
            MediSaaS
            <span className="text-orange-500"> CI</span>
          </span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">
            Gestion médicale
          </span>
        </div>
      )}
    </div>
  );
}
