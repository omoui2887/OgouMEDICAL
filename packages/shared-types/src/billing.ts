// ============================================================
// MediSaaS CI — Facturation & paiements Mobile Money
// TVA applicable : 18 % (CGI Côte d'Ivoire)
// ============================================================

/** Moyens de paiement supportés (Mobile Money ivoirien + carte + espèces). */
export type PaymentMethod =
  | "orange_money"
  | "wave"
  | "mtn_money"
  | "card"
  | "cash";

/** Statut d'une facture. */
export type InvoiceStatus = "impayee" | "payee" | "partielle" | "annulee";

/** Statut d'un paiement (transaction Mobile Money / carte). */
export type PaymentStatus = "en_attente" | "reussi" | "echoue" | "rembourse";

/** Ligne de facturation (prestation). */
export interface InvoiceItem {
  description: string;
  quantity: number;
  /** Prix unitaire en FCFA. */
  unitPrice: number;
}

/**
 * Facture émise par le cabinet à un patient.
 * Le total = sous-total + TVA 18 %. Les montants sont en FCFA
 * (entiers — pas de décimales en FCFA).
 */
export interface Invoice {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  /** Numéro de facture (ex: FAC-2024-0001). */
  number: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  /** Sous-total en FCFA (avant TVA). */
  subtotal: number;
  /** Montant de TVA en FCFA. */
  tax: number;
  /** Total TTC en FCFA. */
  total: number;
  status: InvoiceStatus;
  /** Montant déjà réglé en FCFA (0 si impayée). */
  paidAmount?: number;
  /** Dernière méthode de paiement utilisée. */
  paymentMethod?: PaymentMethod;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Paiement rattaché à une facture.
 * Un paiement Mobile Money transite par CinetPay/Africa's Talking
 * puis est enregistré ici.
 */
export interface Payment {
  id: string;
  invoiceId: string;
  /** Montant en FCFA. */
  amount: number;
  method: PaymentMethod;
  /** Identifiant transaction côté agrégateur (CinetPay). */
  provider?: string;
  /** Référence paiement affichée au patient. */
  reference: string;
  status: PaymentStatus;
  /** Numéro Mobile Money utilisé. */
  phone?: string;
  payerName?: string;
  date: string;
}

/** Données reçues pour créer une facture. */
export interface InvoiceInput {
  patientId: string;
  items: InvoiceItem[];
  /** Taux de TVA en % (18 par défaut en CI). */
  taxRate?: number;
  dueDate?: string;
}

/** Données reçues pour initier un paiement. */
export interface PaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  phone?: string;
  payerName?: string;
}

/** Libellés affichables des statuts de facture. */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  impayee: "Impayée",
  payee: "Payée",
  partielle: "Partielle",
  annulee: "Annulée",
};

/** Libellés affichables des moyens de paiement. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  mtn_money: "MTN Money",
  card: "Carte bancaire",
  cash: "Espèces",
};

/** Libellés affichables des statuts de paiement. */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  en_attente: "En attente",
  reussi: "Réussi",
  echoue: "Échoué",
  rembourse: "Remboursé",
};

/**
 * Couleurs de marque des moyens de paiement (utile pour les badges).
 * Valeurs = classes Tailwind directes pour rester autonomes.
 */
export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  orange_money: "bg-orange-500", // Orange CI #FF7900
  wave: "bg-sky-500", // Wave #1DC8FF
  mtn_money: "bg-yellow-400 text-yellow-950", // MTN #FFCC00
  card: "bg-violet-500",
  cash: "bg-emerald-500",
};

/** Codes hex bruts des marques Mobile Money ivoiriennes. */
export const PAYMENT_METHOD_HEX: Record<PaymentMethod, string> = {
  orange_money: "#FF7900",
  wave: "#1DC8FF",
  mtn_money: "#FFCC00",
  card: "#7C3AED",
  cash: "#10B981",
};
