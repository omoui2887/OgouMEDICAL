// ============================================================
// MediSaaS CI — Ordonnances électroniques
// ============================================================

/** Statut d'une ordonnance. */
export type PrescriptionStatus = "active" | "expiree" | "annulee";

/** Médicament prescrit (ligne d'ordonnance). */
export interface Medication {
  /** Dénomination commune (DCI) ou nom commercial. */
  name: string;
  /** Dosage (ex: "500 mg"). */
  dosage: string;
  /** Fréquence d'administration (ex: "2 fois par jour"). */
  frequency: string;
  /** Durée du traitement (ex: "7 jours"). */
  duration: string;
  /** Instructions complémentaires (ex: "à prendre pendant les repas"). */
  instructions?: string;
}

/**
 * Ordonnance électronique émise par un médecin du cabinet.
 * Les médicaments sont stockés en JSON côté base (SQLite).
 */
export interface Prescription {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  /** Numéro unique d'ordonnance (ex: ORD-2024-0001). */
  number: string;
  /** Date ISO d'émission. */
  date: string;
  medications: Medication[];
  /** Nombre de jours de validité (30 par défaut). */
  validityDays: number;
  status: PrescriptionStatus;
  notes?: string;
  createdAt?: string;
}

/** Données reçues pour créer une ordonnance. */
export interface PrescriptionInput {
  patientId: string;
  doctorId: string;
  medications: Medication[];
  validityDays?: number;
  notes?: string;
}

/** Libellés affichables des statuts d'ordonnance. */
export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  active: "Active",
  expiree: "Expirée",
  annulee: "Annulée",
};
