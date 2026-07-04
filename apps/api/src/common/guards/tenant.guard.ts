// ============================================================
// tenant.guard.ts — Isolation des données par tenant (cabinet)
// ============================================================
// Extrait le tenantId du JWT validé et l'injecte dans req.tenantId
// pour que les services filtrent automatiquement leurs requêtes
// Prisma par cabinet.
//
// Sécurité critique multi-tenant :
//  - super_admin (tenantId=null) → accès cross-tenant (pas de filtre)
//  - autres rôles → tenantId OBLIGATOIRE, sinon 403
//
// Conformité Loi 2013-450 : garantit l'isolation des données
// médicales entre cabinets (principe de minimisation).
// ============================================================

import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import type { JwtPayload } from "../../../../packages/shared-types/src";

/**
 * Garde d'isolation multi-tenant — appliquée globalement après JwtAuthGuard.
 * S'assure que req.tenantId est défini pour toute requête authentifiée
 * non-super_admin, afin que les services filtrent par cabinet.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  /**
   * Injecte req.tenantId à partir du payload JWT.
   * Refuse l'accès si tenantId manquant pour un rôle non-super_admin.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      // Routes publiques (avant auth) — on laisse passer
      return true;
    }

    // super_admin n'est pas lié à un tenant (gestion multi-cabinets)
    if (user.role === "super_admin") {
      request.tenantId = null;
      return true;
    }

    if (!user.tenantId) {
      this.logger.error(
        `Utilisateur sans tenantId — userId=${user.sub} role=${user.role}. ` +
          `Violation possible du schéma multi-tenant.`,
      );
      throw new ForbiddenException(
        "Utilisateur non rattaché à un cabinet. Contactez l'administrateur.",
      );
    }

    request.tenantId = user.tenantId;
    return true;
  }
}
