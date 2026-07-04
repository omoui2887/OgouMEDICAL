"use client";

// ============================================================
// MediSaaS CI — PaymentMethodBadge
// Badge Mobile Money avec couleurs de marque (Orange/Wave/MTN/CB/Cash).
// ============================================================

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/** Méthodes de paiement supportées par le badge. */
export type PaymentMethodValue =
  | "orange_money"
  | "wave"
  | "mtn_money"
  | "card"
  | "cash";

/** Configuration de chaque méthode (libellé + couleurs + initiales). */
const METHOD_CONFIG: Record<
  PaymentMethodValue,
  { label: string; bg: string; text: string; ring: string; abbr: string }
> = {
  orange_money: {
    label: "Orange Money",
    bg: "bg-orange-500",
    text: "text-white",
    ring: "ring-orange-200",
    abbr: "OM",
  },
  wave: {
    label: "Wave",
    bg: "bg-sky-500",
    text: "text-white",
    ring: "ring-sky-200",
    abbr: "W",
  },
  mtn_money: {
    label: "MTN Money",
    bg: "bg-yellow-400",
    text: "text-yellow-950",
    ring: "ring-yellow-200",
    abbr: "MTN",
  },
  card: {
    label: "Carte bancaire",
    bg: "bg-violet-500",
    text: "text-white",
    ring: "ring-violet-200",
    abbr: "CB",
  },
  cash: {
    label: "Espèces",
    bg: "bg-emerald-500",
    text: "text-white",
    ring: "ring-emerald-200",
    abbr: "$",
  },
};

const paymentBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ring-1",
  {
    variants: {
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-2.5 py-1",
        lg: "text-sm px-3 py-1.5",
      },
    },
    defaultVariants: { size: "md" },
  }
);

export interface PaymentMethodBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof paymentBadgeVariants> {
  /** Méthode de paiement. */
  method: PaymentMethodValue;
  /** Affiche l'abréviation (pastille) avant le libellé. */
  showAbbr?: boolean;
  /** Affiche uniquement le libellé (sans pastille abbr). */
  labelOnly?: boolean;
}

/**
 * Badge Mobile Money / paiement avec couleurs de marque ivoiriennes.
 *
 * @example
 * <PaymentMethodBadge method="orange_money" />
 * <PaymentMethodBadge method="wave" size="lg" showAbbr />
 * <PaymentMethodBadge method="mtn_money" labelOnly />
 */
export function PaymentMethodBadge({
  method,
  size = "md",
  showAbbr = true,
  labelOnly = false,
  className,
  ...props
}: PaymentMethodBadgeProps) {
  const config = METHOD_CONFIG[method];
  if (!config) {
    return null;
  }

  return (
    <span
      className={cn(
        paymentBadgeVariants({ size }),
        config.bg,
        config.text,
        config.ring,
        className
      )}
      title={config.label}
      {...props}
    >
      {!labelOnly && showAbbr ? (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[9px] font-bold leading-none">
          {config.abbr}
        </span>
      ) : null}
      {config.label}
    </span>
  );
}

export { paymentBadgeVariants, METHOD_CONFIG };
