"use client";

// ============================================================
// MediSaaS CI — ConformityBadge
// Badge de conformité réglementaire (Loi ivoirienne n°2013-450).
// ============================================================

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "../lib/cn";

export interface ConformityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Variante visuelle. */
  variant?: "default" | "compact" | "pill";
  /** Texte affiché (défaut : référence à la Loi 2013-450). */
  label?: string;
  /** Affiche l'icône bouclier. */
  showIcon?: boolean;
}

const VARIANT_CLASSES = {
  default:
    "inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  compact:
    "inline-flex items-center gap-1 rounded text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400",
  pill: "inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
} as const;

/**
 * Badge de conformité réglementaire MediSaaS CI.
 * Référence la Loi ivoirienne n°2013-450 sur la protection
 * des données personnelles (ARTCI).
 *
 * @example
 * <ConformityBadge />
 * <ConformityBadge variant="pill" label="Conforme ARTCI" />
 * <ConformityBadge variant="compact" />
 */
export function ConformityBadge({
  variant = "default",
  label = "Conforme Loi 2013-450",
  showIcon = true,
  className,
  ...props
}: ConformityBadgeProps) {
  return (
    <span
      className={cn(VARIANT_CLASSES[variant], className)}
      title="Conforme à la Loi ivoirienne n°2013-450 relative à la protection des données personnelles (ARTCI)"
      {...props}
    >
      {showIcon ? <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
