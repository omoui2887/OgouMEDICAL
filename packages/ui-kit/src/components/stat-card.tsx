"use client";

// ============================================================
// MediSaaS CI — StatCard
// Carte KPI réutilisable ({label, value, trend, icon}).
// ============================================================

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "../lib/cn";

const statCardVariants = cva(
  "relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-900",
  {
    variants: {
      tone: {
        neutral: "border-slate-200 dark:border-slate-800",
        blue: "border-sky-200 dark:border-sky-900",
        green: "border-emerald-200 dark:border-emerald-900",
        orange: "border-amber-200 dark:border-amber-900",
        red: "border-rose-200 dark:border-rose-900",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

const ICON_TONE: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  blue: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300",
  green:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  orange:
    "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
};

const TREND_STYLES = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  flat: "text-slate-500 dark:text-slate-400",
} as const;

export interface StatCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof statCardVariants> {
  /** Libellé du KPI (ex: "Revenus encaissés"). */
  label: string;
  /** Valeur principale (chaîne déjà formatée). */
  value: string;
  /** Icône Lucide à afficher. */
  icon?: LucideIcon;
  /** Tendance (en %). Positive = hausse, négative = baisse. */
  trend?: number;
  /** Libellé de comparaison (ex: "vs mois dernier"). */
  trendLabel?: string;
  /** Sous-titre optionnel (ex: "Cette semaine"). */
  hint?: string;
  /** Description accessible (aria-label) du KPI. */
  ariaLabel?: string;
}

/**
 * Carte KPI réutilisable pour le tableau de bord et les modules.
 *
 * @example
 * <StatCard
 *   label="Patients actifs"
 *   value="1 240"
 *   icon={Users}
 *   trend={12.5}
 *   trendLabel="vs mois dernier"
 *   tone="green"
 * />
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  hint,
  tone = "neutral",
  ariaLabel,
  className,
  ...props
}: StatCardProps) {
  const trendDir =
    typeof trend === "number" ? (trend > 0 ? "up" : trend < 0 ? "down" : "flat") : null;
  const TrendIcon = trendDir === "down" ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(statCardVariants({ tone }), className)}
      aria-label={ariaLabel ?? `${label} : ${value}`}
      role="figure"
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {hint}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
              ICON_TONE[tone ?? "neutral"]
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      {trendDir ? (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              TREND_STYLES[trendDir]
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {Math.abs(trend as number).toFixed(1)}%
          </span>
          {trendLabel ? (
            <span className="text-slate-400 dark:text-slate-500">
              {trendLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { statCardVariants };
