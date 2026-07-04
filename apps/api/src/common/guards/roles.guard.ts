// ============================================================
// roles.guard.ts — Garde RBAC basée sur @Roles(...rôles)
// ============================================================
// Lit la metadata "roles" posée par @Roles() et compare au rôle
// de l'utilisateur (req.user.role). Lève ForbiddenException si le
// rôle ne correspond pas. Routes sans @Roles() = accessibles à
// tout utilisateur authentifié.
// ============================================================

import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { JwtPayload, UserRole } from "../../../../packages/shared-types/src";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * Garde RBAC — à combiner avec JwtAuthGuard :
 * @UseGuards(JwtAuthGuard, RolesGuard)
 *
 * Le super_admin a accès à tout, quel que soit @Roles().
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  /**
   * Vérifie que req.user.role fait partie des rôles autorisés.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Pas de @Roles() → tout utilisateur authentifié peut accéder
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      this.logger.warn(`Accès refusé — utilisateur non authentifié sur route protégée`);
      throw new ForbiddenException("Accès refusé : authentification requise");
    }

    // super_admin = bypass RBAC (accès multi-tenant complet)
    if (user.role === "super_admin") {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      this.logger.warn(
        `Accès refusé — role=${user.role} requis=${requiredRoles.join("|")} userId=${user.sub}`,
      );
      throw new ForbiddenException(
        `Accès refusé : rôle "${user.role}" insuffisant. Requis : ${requiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
