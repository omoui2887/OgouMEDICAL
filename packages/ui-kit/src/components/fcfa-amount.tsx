"use client";

// ============================================================
// MediSaaS CI — FcfaAmount
// Affichage normalisé d'un montant en FCFA.
// ============================================================

import * as React from "react";
import { cn } from "../lib/cn";

export interface FcfaAmountProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Montant en FCFA (entier). */
  amount: number;
  /** Taille d'affichage. */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Variante visuelle. */
  variant?: "default" | "muted" | "success" | "danger" | "warning";
  /** Affiche le montant en gras. */
  bold?: boolean;
  /** Affiche une version compacte (ex: "4,8 M FCFA"). */
  compact?: boolean;
  /** Préfixe optionnel (ex: "+", "-"). */
  prefix?: string;
  /** Affiche le symbole FCFA en plus petit. */
  subtleCurrency?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<FcfaAmountProps["size"]>, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
};

const VARIANT_CLASSES: Record<
  NonNullable<FcfaAmountProps["variant"]>,
  string
> = {
  default: "text-slate-900 dark:text-slate-100",
  muted: "text-slate-500 dark:text-slate-400",
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-rose-600 dark:text-rose-400",
  warning: "text-amber-600 dark:text-amber-400",
};

/**
 * Formate un montant en FCFA (format français).
 * @example
 * formatAmount(1200000)        // "1 200 000 FCFA"
 * formatAmount(4800000, true)  // "4,8 M FCFA"
 */
function formatAmount(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return (
        (amount / 1_000_000).toLocaleString("fr-FR", {
          maximumFractionDigits: 1,
        }) + " M FCFA"
      );
    }
    if (Math.abs(amount) >= 1_000) {
      return Math.round(amount / 1_000) + " k FCFA";
    }
    return amount + " FCFA";
  }
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

/**
 * Affiche un montant en FCFA avec un formatage cohérent.
 *
 * @example
 * <FcfaAmount amount={75000} />
 * <FcfaAmount amount={4800000} compact size="lg" variant="success" />
 * <FcfaAmount amount={-292640} prefix="" variant="danger" />
 */
export function FcfaAmount({
  amount,
  size = "md",
  variant = "default",
  bold = false,
  compact = false,
  prefix,
  subtleCurrency = false,
  className,
  ...props
}: FcfaAmountProps) {
  // Sépare le montant du suffixe "FCFA" pour styler ce dernier différemment.
  const formatted = formatAmount(amount, compact);
  const [numberPart, ...rest] = formatted.split(" FCFA");
  const suffix = " FCFA";

  return (
    <span
      className={cn(
        "tabular-nums whitespace-nowrap",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        bold && "font-bold",
        className
      )}
      {...props}
    >
      {prefix ? <span className="mr-0.5">{prefix}</span> : null}
      {numberPart}
      {rest.length > 0 ? " " + rest.join(" ") : ""}
      {subtleCurrency ? (
        <span className="ml-1 text-[0.7em] font-normal opacity-60">
          {suffix.trim()}
        </span>
      ) : (
        suffix
      )}
    </span>
  );
}

export { formatAmount };
