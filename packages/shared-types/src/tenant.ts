// ============================================================
// MediSaaS CI — Tenant (multi-tenant / multi-cabinet)
// ============================================================

/** Type d'établissement de santé. */
export type TenantType = "cabinet" | "clinique" | "centre" | "cabinet_groupe";

/** Statut commercial d'un tenant. */
export type TenantStatus = "actif" | "suspendu" | "inactif";

import type { Plan } from "./subscription";

/**
 * Tenant — Cabinet ou clinique cliente de MediSaaS CI.
 * Racine de l'isolation multi-tenant : toutes les entités métier
 * référencent leur `tenantId`.
 */
export interface Tenant {
  id: string;
  /** Nom commercial affiché. */
  name: string;
  /** Slug URL-friendly unique (ex: "clinique-plateau"). */
  slug: string;
  type: TenantType;
  city: string;
  /** Commune / quartier (ex: "Cocody - Plateau"). */
  district?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Numéro RCCM ou n° d'agrément (optionnel). */
  rccm?: string;
  plan: Plan;
  status: TenantStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Paramètres configurables d'un tenant (horaires, marque, etc.).
 * Stockés séparément pour ne pas surcharger le modèle Tenant.
 */
export interface TenantSettings {
  tenantId: string;
  /** Logo (URL ou data-URI). */
  logoUrl?: string;
  /** Couleur primaire de la marque (hex). */
  primaryColor?: string;
  /** Fuseau horaire — défaut "Africa/Abidjan". */
  timezone: string;
  /** Langue — défaut "fr". */
  locale: string;
  /** Devise — défaut "XOF" (FCFA). */
  currency: string;
  /** Taux de TVA applicable (18 par défaut en CI). */
  taxRate: number;
  /** Horaires d'ouverture par jour (JSON sérialisé en base). */
  openingHours: OpeningHours;
  /** Active les notifications SMS via Africa's Talking. */
  smsEnabled: boolean;
  /** Active les rappels WhatsApp via WhatsApp Business API. */
  whatsappEnabled: boolean;
  /** Active la téléconsultation Daily.co. */
  teleconsultationEnabled: boolean;
  /** Mode maintenance (bloque l'accès patient). */
  maintenanceMode: boolean;
}

/** Horaires d'ouverture par jour de la semaine. */
export interface OpeningHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

/** Plages horaires d'une journée. */
export interface DaySchedule {
  /** True si le cabinet est fermé ce jour. */
  closed?: boolean;
  /** Plages d'ouverture (ex: [{open:"08:00",close:"12:30"},…]). */
  slots: Array<{ open: string; close: string }>;
}

/** Libellés affichables des types de tenant. */
export const TENANT_TYPE_LABELS: Record<TenantType, string> = {
  cabinet: "Cabinet",
  clinique: "Clinique",
  centre: "Centre médical",
  cabinet_groupe: "Groupe de cabinets",
};

/** Libellés affichables des statuts de tenant. */
export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  actif: "Actif",
  suspendu: "Suspendu",
  inactif: "Inactif",
};
