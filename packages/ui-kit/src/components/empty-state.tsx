"use client";

// ============================================================
// MediSaaS CI — EmptyState
// État vide standard pour les listes / tableaux / modules.
// ============================================================

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icône illustrant l'état vide (Lucide). */
  icon?: LucideIcon;
  /** Titre court (ex: "Aucun rendez-vous"). */
  title: string;
  /** Description plus longue (ex: "Planifiez votre premier RDV…"). */
  description?: string;
  /** Action principale (bouton/CTA). */
  action?: React.ReactNode;
  /** Taille de l'illustration. */
  size?: "sm" | "md" | "lg";
  /** Compact : masque la description. */
  compact?: boolean;
}

const ICON_SIZES = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
} as const;

const ICON_WRAPPER = {
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
} as const;

/**
 * État vide standard MediSaaS CI.
 * À utiliser dans les listes/tables filtrées sans résultat, les
 * modules vides (aucune facture, aucune ordonnance…).
 *
 * @example
 * <EmptyState
 *   icon={CalendarX}
 *   title="Aucun rendez-vous"
 *   description="Planifiez un nouveau rendez-vous pour vos patients."
 *   action={<Button>Nouveau RDV</Button>}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900/50",
        compact && "py-6",
        className
      )}
      role="status"
      {...props}
    >
      {Icon ? (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
            ICON_SIZES[size],
            ICON_WRAPPER[size]
          )}
        >
          <Icon className={cn(ICON_SIZES[size])} aria-hidden="true" />
        </div>
      ) : null}
      <h3
        className={cn(
          "font-semibold text-slate-900 dark:text-slate-100",
          compact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>
      {description && !compact ? (
        <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
