// ============================================================
// MediSaaS CI — Rendez-vous & téléconsultation
// ============================================================

/** Statut d'un rendez-vous dans son cycle de vie. */
export type AppointmentStatus =
  | "planifie"
  | "confirme"
  | "en_cours"
  | "termine"
  | "annule"
  | "absent";

/** Type de rendez-vous (présentiel ou téléconsultation). */
export type AppointmentType = "presentiel" | "teleconsultation";

/**
 * Rendez-vous médical.
 * Un RDV peut être présentiel (cabinet) ou en téléconsultation
 * (Daily.co). Le `tenantId` garantit l'isolation multi-tenant.
 */
export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  patientAvatarColor: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  /** Date ISO complète (YYYY-MM-DDTHH:mm:ss). */
  date: string;
  /** Heure formatée "HH:mm". */
  time: string;
  /** Durée en minutes. */
  duration: number;
  /** Motif de consultation. */
  reason: string;
  type: AppointmentType;
  status: AppointmentStatus;
  /** Commune d'origine du patient (utile pour le tableau de bord). */
  commune: string;
  /** Notes libres (côté secrétaire/médecin). */
  notes?: string;
  /** Lien Daily.co pour la téléconsultation. */
  roomUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Données reçues pour créer un rendez-vous. */
export interface AppointmentInput {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration?: number;
  reason: string;
  type: AppointmentType;
  notes?: string;
}

/** Libellés affichables des statuts de RDV. */
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  planifie: "Planifié",
  confirme: "Confirmé",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
  absent: "Absent",
};

/** Libellés des types de RDV. */
export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  presentiel: "Présentiel",
  teleconsultation: "Téléconsultation",
};
