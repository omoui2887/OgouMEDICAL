// ============================================================
// MediSaaS CI — ui-kit : utilitaire `cn`
// Combinaison clsx + tailwind-merge, sans dépendance shadcn.
// ============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind en gérant les conflits via tailwind-merge.
 * @example
 * cn("px-2 py-1", condition && "bg-red-500", "px-4") // "py-1 bg-red-500 px-4"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
