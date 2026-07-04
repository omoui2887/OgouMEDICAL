// ============================================================
// MediSaaS CI — ui-kit : barrel export
// Point d'entrée unique du package @medisaas/ui-kit.
// ============================================================

// --- Utilitaires ---
export { cn } from "./lib/cn";
export {
  MEDICAL_COLORS,
  MOBILE_MONEY_COLORS,
  BLOOD_TYPE_COLORS,
  AVATAR_COLOR_PALETTE,
  pickAvatarColor,
} from "./lib/colors";

// --- Composants métier ---
export { MedicalBadge, medicalBadgeVariants } from "./components/medical-badge";
export type { MedicalBadgeProps } from "./components/medical-badge";

export { PatientAvatar } from "./components/patient-avatar";
export type { PatientAvatarProps } from "./components/patient-avatar";

export {
  PaymentMethodBadge,
  paymentBadgeVariants,
  METHOD_CONFIG as PAYMENT_METHOD_BADGE_CONFIG,
} from "./components/payment-method-badge";
export type {
  PaymentMethodBadgeProps,
  PaymentMethodValue,
} from "./components/payment-method-badge";

export { FcfaAmount, formatAmount } from "./components/fcfa-amount";
export type { FcfaAmountProps } from "./components/fcfa-amount";

export { StatCard, statCardVariants } from "./components/stat-card";
export type { StatCardProps } from "./components/stat-card";

export { EmptyState } from "./components/empty-state";
export type { EmptyStateProps } from "./components/empty-state";

export { ConformityBadge } from "./components/conformity-badge";
export type { ConformityBadgeProps } from "./components/conformity-badge";
