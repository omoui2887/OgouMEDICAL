// ============================================================
// roles.decorator.ts — Décorateur @Roles(...rôles) pour RBAC
// ============================================================
// Associe un ou plusieurs rôles autorisés à une route.
// RolesGuard lit cette metadata et lève ForbiddenException si
// l'utilisateur courant n'a pas le bon rôle.
// ============================================================

import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "../../../../packages/shared-types/src";

/** Clé metadata lue par RolesGuard. */
export const ROLES_KEY = "roles";

/**
 * Décorateur de méthode/classe — restreint l'accès aux rôles fournis.
 *
 * @example
 * @Roles('medecin', 'admin_cabinet')
 * @Post('prescriptions')
 * create(@Body() dto: CreatePrescriptionDto) { ... }
 *
 * @param roles - Liste des rôles autorisés (RBAC — 6 rôles MediSaaS CI).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
