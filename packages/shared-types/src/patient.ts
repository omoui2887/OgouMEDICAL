// ============================================================
// MediSaaS CI — Dossier Patient Numérique (DPN)
// Conformité Loi ivoirienne n°2013-450 (protection des données)
// ============================================================

/** Genre administratif. */
export type Gender = "M" | "F";

/** Groupes sanguins normalisés. */
export type BloodType =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

/** Statut d'activité du patient dans le cabinet. */
export type PatientStatus = "actif" | "inactif";

/**
 * Patient — Dossier Patient Numérique (DPN).
 * Le `tenantId` isole les données entre cabinets (multi-tenant).
 */
export interface Patient {
  /** Identifiant unique (cuid côté Prisma). */
  id: string;
  /** Identifiant du cabinet propriétaire. */
  tenantId: string;
  /** Code patient unique au cabinet (ex: CI-CP-0001). */
  code: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  /** Date de naissance ISO (YYYY-MM-DD). */
  birthDate: string;
  phone: string;
  email?: string;
  address?: string;
  /** Commune d'Abidjan (Cocody, Yopougon, Plateau, …). */
  commune: string;
  bloodType?: BloodType;
  /** Poids en kg. */
  weight?: number;
  /** Taille en cm. */
  height?: number;
  allergies: string[];
  chronicConditions: string[];
  /** Contact d'urgence (nom + téléphone libre). */
  emergencyContact?: string;
  /** Organisme d'assurance (CNPS, mutuelle, …). */
  insuranceProvider?: string;
  insuranceNumber?: string;
  /** Date ISO de la dernière visite. */
  lastVisit?: string;
  status: PatientStatus;
  /** Classe Tailwind pour la couleur d'avatar (cohérence visuelle). */
  avatarColor: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Données reçues lors de la création/mise à jour d'un patient.
 * Les champs `id`, `code`, `tenantId`, `createdAt` sont générés
 * côté serveur.
 */
export interface PatientInput {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  email?: string;
  address?: string;
  commune: string;
  bloodType?: BloodType;
  weight?: number;
  height?: number;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
}

/**
 * Dossier médical consolidé d'un patient.
 * Assemblé par l'API à partir des consultations, ordonnances,
 * factures et paiements liés au patient.
 */
export interface MedicalRecord {
  patient: Patient;
  consultations: Array<{
    id: string;
    date: string;
    doctorName: string;
    diagnosis: string;
    treatment: string;
  }>;
  prescriptions: Array<{
    id: string;
    number: string;
    date: string;
    doctorName: string;
    status: "active" | "expiree" | "annulee";
    medicationsCount: number;
  }>;
  invoices: Array<{
    id: string;
    number: string;
    date: string;
    total: number;
    status: "impayee" | "payee" | "partielle" | "annulee";
  }>;
  vitals: {
    lastTemp?: number;
    lastTension?: string;
    lastPulse?: number;
    lastWeight?: number;
  };
}
