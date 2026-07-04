// ============================================================
// MediSaaS CI — Barrel export des types partagés
// Point d'entrée unique du package @medisaas/shared-types.
// Consommé par apps/web, apps/api et packages/ui-kit.
// ============================================================

// --- Rôles & permissions ---
export {
  Role,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ALL_ROLES,
  hasPermission,
  hasAnyPermission,
} from "./roles";
export type { Permission } from "./roles";

// --- Patient ---
export type {
  Patient,
  PatientInput,
  MedicalRecord,
  Gender,
  BloodType,
  PatientStatus,
} from "./patient";

// --- Rendez-vous ---
export {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from "./appointment";
export type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  AppointmentType,
} from "./appointment";

// --- Ordonnances ---
export { PRESCRIPTION_STATUS_LABELS } from "./prescription";
export type {
  Prescription,
  PrescriptionInput,
  Medication,
  PrescriptionStatus,
} from "./prescription";

// --- Facturation & paiements ---
export {
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_COLORS,
  PAYMENT_METHOD_HEX,
} from "./billing";
export type {
  Invoice,
  InvoiceInput,
  InvoiceItem,
  InvoiceStatus,
  Payment,
  PaymentInput,
  PaymentMethod,
  PaymentStatus,
} from "./billing";

// --- Abonnements SaaS ---
export {
  PLANS,
  PLAN_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "./subscription";
export type {
  Subscription,
  PlanDescriptor,
  Plan,
  BillingCycle,
  SubscriptionStatus,
} from "./subscription";

// --- Tenant (multi-tenant) ---
export {
  TENANT_TYPE_LABELS,
  TENANT_STATUS_LABELS,
} from "./tenant";
export type {
  Tenant,
  TenantSettings,
  TenantType,
  TenantStatus,
  OpeningHours,
  DaySchedule,
} from "./tenant";

// --- API ---
export { API_ERROR_CODES, buildApiError } from "./api";
export type {
  ApiResponse,
  ApiErrorResponse,
  ApiResult,
  PaginatedResponse,
  ApiError,
} from "./api";

// --- Utilitaires partagés ---
export {
  formatFCFA,
  formatFCFAShort,
  formatDate,
  formatDateTime,
  calcAge,
  calcBMI,
  initials,
  truncate,
  isIvorianPhone,
} from "./utils";
