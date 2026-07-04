// ============================================================
// MediSaaS CI — Types partagés
// ============================================================

export type Role =
  | "super_admin"
  | "admin_cabinet"
  | "medecin"
  | "secretaire"
  | "patient"
  | "comptable";

export type ModuleKey =
  | "dashboard"
  | "appointments"
  | "patients"
  | "prescriptions"
  | "billing"
  | "teleconsultation"
  | "patient-portal"
  | "subscriptions"
  | "analytics"
  | "settings";

export type AppointmentStatus =
  | "planifie"
  | "confirme"
  | "en_cours"
  | "termine"
  | "annule"
  | "absent";

export type AppointmentType =
  | "consultation"
  | "suivi"
  | "teleconsultation"
  | "urgence"
  | "visite_domicile";

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: "Consultation",
  suivi: "Suivi",
  teleconsultation: "Téléconsultation",
  urgence: "Urgence",
  visite_domicile: "Visite à domicile",
};

// Codes couleur par statut (palette médicale)
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string; border: string; hex: string }> = {
  planifie: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-300", hex: "#0EA5E9" },
  confirme: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", hex: "#10B981" },
  en_cours: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", hex: "#F59E0B" },
  termine: { bg: "bg-zinc-100", text: "text-zinc-600", border: "border-zinc-300", hex: "#6B7280" },
  annule: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300", hex: "#EF4444" },
  absent: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300", hex: "#8B5CF6" },
};

export type InvoiceStatus = "impayee" | "payee" | "partielle" | "annulee";

export type PaymentMethod =
  | "orange_money"
  | "wave"
  | "mtn_money"
  | "card"
  | "cash";

export type Plan = "essentiel" | "pro" | "entreprise";

export interface Patient {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  birthDate: string;
  phone: string;
  email?: string;
  address?: string;
  commune: string;
  bloodType?: string;
  weight?: number;
  height?: number;
  allergies: string[];
  chronicConditions: string[];
  insuranceProvider?: string;
  insuranceNumber?: string;
  lastVisit?: string;
  status: "actif" | "inactif";
  avatarColor: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  avatarColor: string;
  licenseNumber: string;
  rating: number;
  patientsCount: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatarColor: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string; // ISO
  time: string; // "09:30"
  duration: number;
  reason: string;
  type: AppointmentType;
  status: AppointmentStatus;
  commune: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  number: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  medications: Medication[];
  validityDays: number;
  status: "active" | "expiree" | "annulee";
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: "reussi" | "en_attente" | "echoue";
  payerName: string;
  phone: string;
  date: string;
}

export interface Consultation {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  vitals: {
    temp?: number;
    tension?: string;
    pulse?: number;
    weight?: number;
  };
}

export interface Subscription {
  tenantId: string;
  plan: Plan;
  status: "actif" | "essai" | "suspendu" | "resilie";
  billingCycle: "mensuel" | "annuel";
  amount: number;
  seats: number;
  usedSeats: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentMethod?: PaymentMethod;
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Administrateur",
  admin_cabinet: "Administrateur Cabinet",
  medecin: "Médecin",
  secretaire: "Secrétaire",
  patient: "Patient",
  comptable: "Comptable",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  mtn_money: "MTN Money",
  card: "Carte bancaire",
  cash: "Espèces",
};

export const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  orange_money: "bg-orange-500",
  wave: "bg-sky-500",
  mtn_money: "bg-yellow-400 text-yellow-950",
  card: "bg-violet-500",
  cash: "bg-emerald-500",
};

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
