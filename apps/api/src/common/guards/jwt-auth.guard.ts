// ============================================================
// jwt-auth.guard.ts — Garde d'authentification JWT
// ============================================================
// Vérifie la présence et la validité du JWT dans l'en-tête
// Authorization: Bearer <token>. Saute l'auth si @Public() est
// présent sur la route. Délègue à PassportJwtStrategy pour la
// vérification cryptographique et l'extraction du payload.
// ============================================================

import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Garde JWT — appliquée globalement dans main.ts via APP_GUARD.
 * Routes publiques (login, register, webhooks) marquées avec @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Vérifie si la route est publique (@Public) avant de valider le JWT.
   * Si publique → true (skip auth). Sinon → délègue à Passport.
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
