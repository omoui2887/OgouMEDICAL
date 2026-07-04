// ============================================================
// MediSaaS CI — Plans SaaS & abonnements
// ============================================================

/** Plans tarifaires MediSaaS CI. */
export type Plan = "essentiel" | "pro" | "entreprise";

/** Cycle de facturation de l'abonnement. */
export type BillingCycle = "mensuel" | "annuel";

/** Statut d'un abonnement SaaS. */
export type SubscriptionStatus = "actif" | "essai" | "suspendu" | "resilie";

import type { PaymentMethod } from "./billing";

/**
 * Abonnement SaaS d'un tenant (cabinet).
 * Un seul abonnement par tenant (tenantId unique).
 */
export interface Subscription {
  id: string;
  tenantId: string;
  plan: Plan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  /** Montant en FCFA (par cycle). */
  amount: number;
  /** Nombre de sièges utilisateurs inclus. */
  seats: number;
  /** Sièges effectivement utilisés. */
  usedSeats: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentMethod?: PaymentMethod;
  createdAt?: string;
  updatedAt?: string;
}

/** Description marketing d'un plan (page tarifs). */
export interface PlanDescriptor {
  id: Plan;
  name: string;
  /** Prix mensuel en FCFA. */
  monthlyPrice: number;
  /** Prix annuel en FCFA (≈ 12 × mensuel × 0,8). */
  annualPrice: number;
  tagline: string;
  features: string[];
  /** Indique le plan mis en avant commercialement. */
  highlighted?: boolean;
  /** Limites incluses dans le plan. */
  limits: {
    users: number | "illimité";
    patients: number | "illimité";
    teleconsultations: number | "illimité";
    smsPerMonth: number;
  };
}

/** Catalogue des 3 plans SaaS MediSaaS CI. */
export const PLANS: PlanDescriptor[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    monthlyPrice: 25000,
    annualPrice: 240000,
    tagline: "Pour les petits cabinets de quartier",
    features: [
      "Jusqu'à 3 utilisateurs",
      "Dossier patient numérique (DPN)",
      "Prise de rendez-vous en ligne",
      "Facturation & Mobile Money",
      "Support email (48 h)",
    ],
    limits: {
      users: 3,
      patients: 500,
      teleconsultations: 20,
      smsPerMonth: 200,
    },
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 75000,
    annualPrice: 720000,
    tagline: "La solution complète pour cliniques",
    features: [
      "Jusqu'à 10 utilisateurs",
      "Téléconsultation Daily.co",
      "Ordonnances électroniques",
      "Analytique avancée",
      "SMS/WhatsApp rappels RDV",
      "Support prioritaire (4 h)",
    ],
    highlighted: true,
    limits: {
      users: 10,
      patients: "illimité",
      teleconsultations: 50,
      smsPerMonth: 1000,
    },
  },
  {
    id: "entreprise",
    name: "Entreprise",
    monthlyPrice: 180000,
    annualPrice: 1728000,
    tagline: "Pour les groupes & réseaux de cliniques",
    features: [
      "Utilisateurs illimités",
      "Multi-sites & multi-cabinet",
      "API & Webhooks",
      "SSO / SAML",
      "SLA 99,9 % & support dédié",
      "Conformité Loi 2013-450 avancée",
    ],
    limits: {
      users: "illimité",
      patients: "illimité",
      teleconsultations: "illimité",
      smsPerMonth: 10000,
    },
  },
];

/** Libellés affichables des plans. */
export const PLAN_LABELS: Record<Plan, string> = {
  essentiel: "Essentiel",
  pro: "Pro",
  entreprise: "Entreprise",
};

/** Libellés affichables des statuts d'abonnement. */
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  actif: "Actif",
  essai: "Période d'essai",
  suspendu: "Suspendu",
  resilie: "Résilié",
};
