// ============================================================
// MediSaaS CI — palette médicale centralisée
// Référence les couleurs métier pour les composants ui-kit.
// ============================================================

/**
 * Couleurs de la marque MediSaaS CI (palette médicale).
 * Les composants utilisent ces valeurs hex via des classes
 * Tailwind `bg-[#hex]` ou via les variables CSS `--medical-*`.
 */
export const MEDICAL_COLORS = {
  /** Bleu médical (primary). */
  blue: "#0EA5E9",
  /** Vert médical (santé / succès). */
  green: "#10B981",
  /** Orange (accent, alerte modérée). */
  orange: "#F59E0B",
  /** Rouge (danger, urgence). */
  red: "#EF4444",
} as const;

/**
 * Couleurs officielles des marques Mobile Money ivoiriennes.
 * Utilisées par `PaymentMethodBadge`.
 */
export const MOBILE_MONEY_COLORS = {
  /** Orange Money — Orange CI. */
  orange: "#FF7900",
  /** Wave. */
  wave: "#1DC8FF",
  /** MTN Money. */
  mtn: "#FFCC00",
} as const;

/**
 * Mapping groupes sanguins → couleur d'arrière-plan (classes Tailwind).
 * Utilisé par `MedicalBadge` (variant `blood`).
 */
export const BLOOD_TYPE_COLORS: Record<string, string> = {
  "A+": "bg-rose-100 text-rose-700 border-rose-200",
  "A-": "bg-rose-50 text-rose-600 border-rose-200",
  "B+": "bg-sky-100 text-sky-700 border-sky-200",
  "B-": "bg-sky-50 text-sky-600 border-sky-200",
  "AB+": "bg-violet-100 text-violet-700 border-violet-200",
  "AB-": "bg-violet-50 text-violet-600 border-violet-200",
  "O+": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "O-": "bg-emerald-50 text-emerald-600 border-emerald-200",
};

/**
 * Palette de couleurs d'avatar patient (cycle déterministe).
 * Évite l'indigo/bleu conformément à la charte MediSaaS CI.
 */
export const AVATAR_COLOR_PALETTE = [
  "bg-teal-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-500",
  "bg-pink-500",
] as const;

/**
 * Choisit une couleur d'avatar déterministe à partir d'une chaîne.
 * (Hash simple → index du tableau.)
 */
export function pickAvatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLOR_PALETTE[h % AVATAR_COLOR_PALETTE.length];
}
