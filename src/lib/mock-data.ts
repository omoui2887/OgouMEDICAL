// ============================================================
// OgouMEDICAL — Données (vider pour production)
// Le SaaS démarre vierge. Les données sont chargées depuis Supabase.
// Conçu par Romain OGOU (ogouromain@gmail.com | +225 05 76 10 32 77)
// ============================================================
import type {
  Patient, Doctor, Appointment, Prescription, Invoice, Payment,
  Consultation, Subscription,
} from "./types";

// ---------- TENANT (configuré au démarrage) ----------
export const TENANT = {
  id: "ten_ogoumedical",
  name: "OgouMEDICAL",
  slug: "ogoumedical",
  type: "cabinet",
  city: "Abidjan",
  district: "Côte d'Ivoire",
  phone: "+225 05 76 10 32 77",
  email: "ogouromain@gmail.com",
  address: "Côte d'Ivoire",
};

// ---------- TABLEAUX VIDES (le cabinet saisit ses propres données) ----------
export const DOCTORS: Doctor[] = [];
export const PATIENTS: Patient[] = [];
export const APPOINTMENTS: Appointment[] = [];
export const PRESCRIPTIONS: Prescription[] = [];
export const INVOICES: Invoice[] = [];
export const PAYMENTS: Payment[] = [];
export const CONSULTATIONS: Consultation[] = [];

// ---------- ABONNEMENT ----------
export const SUBSCRIPTION: Subscription = {
  tenantId: TENANT.id,
  plan: "essentiel",
  status: "essai",
  billingCycle: "mensuel",
  amount: 0,
  seats: 1,
  usedSeats: 1,
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
};

// ---------- PLANS D'ABONNEMENT ----------
export const PLANS = [
  {
    id: "essentiel" as const,
    name: "Essentiel",
    price: 15000,
    tagline: "Pour le médecin solo",
    seats: 1,
    features: [
      "RDV en ligne",
      "50 patients/mois",
      "Ordonnances électroniques",
      "Facturation basique",
      "Support email",
    ],
    popular: false,
    color: "bg-sky-500",
  },
  {
    id: "pro" as const,
    name: "Professionnel",
    price: 75000,
    tagline: "Pour les cliniques en croissance",
    seats: 10,
    features: [
      "Tout Essentiel, plus :",
      "Patients illimités",
      "Téléconsultation vidéo",
      "Paiements Mobile Money (GeniusPay)",
      "SMS & notifications WhatsApp",
      "Tableau de bord analytique",
      "10 utilisateurs inclus",
      "Support prioritaire",
    ],
    popular: true,
    color: "bg-sky-600",
  },
  {
    id: "entreprise" as const,
    name: "Entreprise",
    price: 180000,
    tagline: "Pour les groupes médicaux multi-sites",
    seats: 50,
    features: [
      "Tout Professionnel, plus :",
      "Multi-sites & multi-tenant",
      "Utilisateurs illimités",
      "API & intégrations personnalisées",
      "Conformité Loi 2013-450 avancée",
      "SLA 99,9% & support dédié",
    ],
    popular: false,
    color: "bg-orange-500",
  },
];

// ---------- DONNÉES ANALYTIQUES (vides au démarrage) ----------
export const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 0, consultations: 0 },
  { month: "Fév", revenue: 0, consultations: 0 },
  { month: "Mar", revenue: 0, consultations: 0 },
  { month: "Avr", revenue: 0, consultations: 0 },
  { month: "Mai", revenue: 0, consultations: 0 },
  { month: "Juin", revenue: 0, consultations: 0 },
  { month: "Juil", revenue: 0, consultations: 0 },
  { month: "Août", revenue: 0, consultations: 0 },
  { month: "Sep", revenue: 0, consultations: 0 },
  { month: "Oct", revenue: 0, consultations: 0 },
  { month: "Nov", revenue: 0, consultations: 0 },
  { month: "Déc", revenue: 0, consultations: 0 },
];

export const PAYMENT_DISTRIBUTION = [
  { name: "Orange Money", value: 0, color: "var(--chart-2)" },
  { name: "Wave", value: 0, color: "var(--chart-4)" },
  { name: "MTN Money", value: 0, color: "var(--chart-5)" },
  { name: "Carte bancaire", value: 0, color: "var(--chart-3)" },
  { name: "Espèces", value: 0, color: "var(--chart-1)" },
];

export const SPECIALTY_DISTRIBUTION: { name: string; value: number }[] = [];

export const APPOINTMENTS_TREND = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
    rdv: 0,
    termines: 0,
  };
});
