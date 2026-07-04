"use client";

// ============================================================
// MediSaaS CI — PatientAvatar
// Avatar patient avec initiales et couleur déterministe.
// ============================================================

import * as React from "react";
import { cn } from "../lib/cn";
import { pickAvatarColor } from "../lib/colors";

export interface PatientAvatarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Prénom (utilisée pour les initiales). */
  firstName: string;
  /** Nom (utilisée pour les initiales). */
  lastName: string;
  /** Taille du badge. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Couleur d'arrière-plan explicite (sinon dérivée du nom). */
  color?: string;
  /** Indicateur en ligne (point vert) — optionnel. */
  online?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<PatientAvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
};

/**
 * Calcule les initiales (max 2 lettres) d'un nom.
 */
function buildInitials(first: string, last: string): string {
  const f = first.trim().charAt(0).toUpperCase();
  const l = last.trim().charAt(0).toUpperCase();
  return (f + l) || "??";
}

/**
 * Avatar patient réutilisable.
 * Couleur d'arrière-plan déterministe à partir du nom complet
 * (sauf si `color` est fourni explicitement).
 *
 * @example
 * <PatientAvatar firstName="Aya" lastName="Kouassi" size="md" />
 * <PatientAvatar firstName="Aya" lastName="Kouassi" online />
 */
export function PatientAvatar({
  firstName,
  lastName,
  size = "md",
  color,
  online = false,
  className,
  ...props
}: PatientAvatarProps) {
  const initials = buildInitials(firstName, lastName);
  const bg = color ?? pickAvatarColor(`${firstName} ${lastName}`);

  return (
    <div className={cn("relative inline-flex shrink-0", className)} {...props}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white shadow-sm ring-2 ring-white/60 dark:ring-white/10",
          SIZE_CLASSES[size],
          bg
        )}
        aria-label={`Avatar de ${firstName} ${lastName}`}
        role="img"
      >
        {initials}
      </div>
      {online ? (
        <span
          className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
          aria-label="En ligne"
        />
      ) : null}
    </div>
  );
}
