"use client";

// ============================================================
// MediSaaS CI — MedicalBadge
// Badge métier spécialisé pour les données médicales.
// 4 variantes : blood (groupe sanguin), insurance, status, payment.
// ============================================================

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { BLOOD_TYPE_COLORS } from "../lib/colors";

/** Variantes disponibles du badge médical. */
const medicalBadgeVariants = cva(
  // Base commune : inline-flex, bordure arrondie, typo compacte.
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        // Groupe sanguin — couleur dépend de la valeur (A+/O-…).
        blood: "border",
        // Assurance (CNPS, mutuelle…) — vert médical.
        insurance: "bg-emerald-50 text-emerald-700 border-emerald-200",
        // Statut générique (actif/inactif/confirmé…).
        status: "bg-slate-100 text-slate-700 border-slate-200",
        // Statut paiement.
        payment: "bg-amber-50 text-amber-700 border-amber-200",
      },
    },
    defaultVariants: { variant: "status" },
  }
);

/** Statuts gérés nativement par la variante `status`. */
const STATUS_STYLES: Record<string, string> = {
  actif: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactif: "bg-slate-100 text-slate-500 border-slate-200",
  confirme: "bg-emerald-50 text-emerald-700 border-emerald-200",
  planifie: "bg-sky-50 text-sky-700 border-sky-200",
  en_cours: "bg-amber-50 text-amber-700 border-amber-200",
  termine: "bg-slate-100 text-slate-600 border-slate-200",
  annule: "bg-rose-50 text-rose-700 border-rose-200",
  absent: "bg-rose-50 text-rose-700 border-rose-200",
  impayee: "bg-rose-50 text-rose-700 border-rose-200",
  payee: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partielle: "bg-amber-50 text-amber-700 border-amber-200",
  annulee: "bg-slate-100 text-slate-500 border-slate-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expiree: "bg-slate-100 text-slate-500 border-slate-200",
  reussi: "bg-emerald-50 text-emerald-700 border-emerald-200",
  en_attente: "bg-amber-50 text-amber-700 border-amber-200",
  echoue: "bg-rose-50 text-rose-700 border-rose-200",
};

export interface MedicalBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof medicalBadgeVariants> {
  /** Valeur affichée (ex: "A+", "CNPS", "actif"). */
  value: string;
  /** Libellé optionnel affiché avant la valeur (ex: "Sang :"). */
  label?: string;
}

/**
 * Badge métier MediSaaS CI.
 *
 * @example
 * <MedicalBadge variant="blood" value="A+" />
 * <MedicalBadge variant="insurance" value="CNPS" />
 * <MedicalBadge variant="status" value="actif" />
 * <MedicalBadge variant="payment" value="payee" />
 */
export function MedicalBadge({
  variant = "status",
  value,
  label,
  className,
  ...props
}: MedicalBadgeProps) {
  // Cas particulier : la variante `blood` dérive sa couleur de la valeur.
  if (variant === "blood") {
    const color = BLOOD_TYPE_COLORS[value] ?? BLOOD_TYPE_COLORS["O+"];
    return (
      <span
        className={cn(medicalBadgeVariants({ variant: "blood" }), color, className)}
        {...props}
      >
        {label ? <span className="opacity-70">{label}</span> : null}
        <span className="font-bold">{value}</span>
      </span>
    );
  }

  // Cas particulier : la variante `status` dérive sa couleur de la valeur.
  if (variant === "status") {
    const override = STATUS_STYLES[value];
    return (
      <span
        className={cn(
          medicalBadgeVariants({ variant: "status" }),
          override,
          className
        )}
        {...props}
      >
        {label ? <span className="opacity-70">{label}</span> : null}
        {value}
      </span>
    );
  }

  // Variantes statiques (insurance / payment).
  return (
    <span
      className={cn(medicalBadgeVariants({ variant }), className)}
      {...props}
    >
      {label ? <span className="opacity-70">{label}</span> : null}
      {value}
    </span>
  );
}

export { medicalBadgeVariants };
