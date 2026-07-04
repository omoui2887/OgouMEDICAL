// ============================================================
// MediSaaS CI — Utilitaires partagés (formatage FCFA / dates)
// Pas de dépendance externe — utilisable front et back.
// ============================================================

/**
 * Formate un montant en FCFA avec séparateur de milliers français.
 * @example
 * formatFCFA(1200000) // "1 200 000 FCFA"
 */
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

/**
 * Formate une date ISO au format court français.
 * @example
 * formatDate("2024-03-14") // "14 mars 2024"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formate une date ISO avec l'heure.
 * @example
 * formatDateTime("2024-03-14T09:30:00") // "14 mars 2024, 09:30"
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formate un montant en FCFA compact (utile pour les KPIs).
 * @example
 * formatFCFAShort(4800000) // "4,8 M FCFA"
 * formatFCFAShort(75000)   // "75 k FCFA"
 */
export function formatFCFAShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    }) + " M FCFA";
  }
  if (Math.abs(amount) >= 1_000) {
    return Math.round(amount / 1_000) + " k FCFA";
  }
  return amount + " FCFA";
}

/**
 * Calcule l'âge en années à partir d'une date de naissance ISO.
 */
export function calcAge(birthDateIso: string, refDate: Date = new Date()): number {
  const birth = new Date(birthDateIso);
  let age = refDate.getFullYear() - birth.getFullYear();
  const m = refDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Calcule l'IMC et renvoie la catégorie associée.
 */
export function calcBMI(weightKg?: number, heightCm?: number): {
  value: number | null;
  category: "insuffisant" | "normal" | "surpoids" | "obese" | null;
  label: string | null;
} {
  if (!weightKg || !heightCm) {
    return { value: null, category: null, label: null };
  }
  const h = heightCm / 100;
  const value = weightKg / (h * h);
  let category: "insuffisant" | "normal" | "surpoids" | "obese";
  if (value < 18.5) category = "insuffisant";
  else if (value < 25) category = "normal";
  else if (value < 30) category = "surpoids";
  else category = "obese";
  const labels = {
    insuffisant: "Insuffisant",
    normal: "Normal",
    surpoids: "Surpoids",
    obese: "Obésité",
  } as const;
  return { value: Math.round(value * 10) / 10, category, label: labels[category] };
}

/**
 * Génère les initiales d'un nom (max 2 caractères).
 * @example
 * initials("Aya", "Kouassi") // "AK"
 */
export function initials(firstName: string, lastName: string): string {
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

/**
 * Tronque un texte à `max` caractères et ajoute une ellipse.
 */
export function truncate(text: string, max = 60): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

/**
 * Vérifie la validité basique d'un numéro de téléphone ivoirien
 * (10 chiffres, préfixe 01/05/07/27).
 */
export function isIvorianPhone(phone: string): boolean {
  return /^(?:\+225\s?)?(?:01|05|07|27)\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/.test(
    phone.replace(/\s+/g, " ").trim()
  );
}
