// ============================================================
// MediSaaS CI — Rôles & permissions (RBAC)
// Définit les 6 rôles de la plateforme et la matrice des
// permissions accordées à chacun. Partagé entre le backend
// (apps/api, middleware) et le frontend (apps/web, ui-kit).
// ============================================================

/**
 * Rôles disponibles dans MediSaaS CI.
 * L'ordre est volontairement du plus privilégié au moins privilégié.
 */
export enum Role {
  /** Administrateur de la plateforme (équipe MediSaaS). */
  SUPER_ADMIN = "super_admin",
  /** Administrateur du cabinet/clinique (gère utilisateurs, abonnement). */
  ADMIN_CABINET = "admin_cabinet",
  /** Médecin (consultations, ordonnances, dossier patient). */
  MEDECIN = "medecin",
  /** Secrétaire (agenda, check-in patients). */
  SECRETAIRE = "secretaire",
  /** Comptable (facturation, paiements, recouvrement). */
  COMPTABLE = "comptable",
  /** Patient connecté au portail patient. */
  PATIENT = "patient",
}

/** Libellés affichables en français pour chaque rôle. */
export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Super Administrateur",
  [Role.ADMIN_CABINET]: "Administrateur Cabinet",
  [Role.MEDECIN]: "Médecin",
  [Role.SECRETAIRE]: "Secrétaire",
  [Role.COMPTABLE]: "Comptable",
  [Role.PATIENT]: "Patient",
};

/**
 * Permissions applicatives fines.
 * Utilisées par le middleware RBAC et le guard API.
 */
export type Permission =
  | "tenant.manage"
  | "user.manage"
  | "subscription.manage"
  | "patient.view"
  | "patient.create"
  | "patient.update"
  | "patient.delete"
  | "appointment.view"
  | "appointment.manage"
  | "prescription.view"
  | "prescription.create"
  | "prescription.cancel"
  | "invoice.view"
  | "invoice.create"
  | "invoice.manage"
  | "payment.collect"
  | "teleconsultation.join"
  | "analytics.view"
  | "audit.view"
  | "settings.manage";

/**
 * Matrice rôle → permissions.
 * `ROLE_PERMISSIONS[Role.MEDECIN]` renvoie la liste des permissions
 * accordées au médecin.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    "tenant.manage",
    "user.manage",
    "subscription.manage",
    "patient.view",
    "patient.create",
    "patient.update",
    "patient.delete",
    "appointment.view",
    "appointment.manage",
    "prescription.view",
    "prescription.create",
    "prescription.cancel",
    "invoice.view",
    "invoice.create",
    "invoice.manage",
    "payment.collect",
    "teleconsultation.join",
    "analytics.view",
    "audit.view",
    "settings.manage",
  ],
  [Role.ADMIN_CABINET]: [
    "user.manage",
    "subscription.manage",
    "patient.view",
    "patient.create",
    "patient.update",
    "appointment.view",
    "appointment.manage",
    "prescription.view",
    "invoice.view",
    "invoice.create",
    "invoice.manage",
    "payment.collect",
    "teleconsultation.join",
    "analytics.view",
    "audit.view",
    "settings.manage",
  ],
  [Role.MEDECIN]: [
    "patient.view",
    "patient.create",
    "patient.update",
    "appointment.view",
    "appointment.manage",
    "prescription.view",
    "prescription.create",
    "prescription.cancel",
    "invoice.view",
    "teleconsultation.join",
  ],
  [Role.SECRETAIRE]: [
    "patient.view",
    "patient.create",
    "patient.update",
    "appointment.view",
    "appointment.manage",
    "invoice.view",
    "invoice.create",
  ],
  [Role.COMPTABLE]: [
    "patient.view",
    "invoice.view",
    "invoice.create",
    "invoice.manage",
    "payment.collect",
    "analytics.view",
  ],
  [Role.PATIENT]: [
    "appointment.view",
    "prescription.view",
    "invoice.view",
    "teleconsultation.join",
  ],
};

/**
 * Vérifie si un rôle possède une permission donnée.
 * @example
 * hasPermission(Role.MEDECIN, "prescription.create") // true
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Vérifie si un rôle possède au moins une des permissions fournies.
 * Pratique pour les routes acceptant plusieurs permissions.
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** Liste ordonnée des rôles (utile pour les menus déroulants). */
export const ALL_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN_CABINET,
  Role.MEDECIN,
  Role.SECRETAIRE,
  Role.COMPTABLE,
  Role.PATIENT,
];
