// ============================================================
// jwt.strategy.ts — Stratégie Passport JWT (vérification token)
// ============================================================
// Extrait le JWT du header Authorization: Bearer <token>, vérifie
// la signature avec JWT_SECRET, et retourne le payload validé.
// Ce payload est ensuite injecté dans req.user par Passport.
// ============================================================

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtPayload, UserRole } from "../../../../../packages/shared-types/src";

/**
 * Stratégie JWT — utilisée par AuthGuard('jwt').
 * Le payload JWT devient req.user (typé JwtPayload).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>("app.jwt.secret");
    if (!secret) {
      // Fail-fast si le secret JWT n'est pas configuré
      throw new Error("JWT_SECRET manquant dans la configuration");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: "medisaas-ci",
      audience: "medisaas-ci-users",
    });
  }

  /**
   * Valide le payload décodé. Passport appelle cette méthode
   * automatiquement après vérification de la signature.
   *
   * @returns JwtPayload injecté dans req.user.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException("Token JWT invalide ou incomplet");
    }

    // Cast défensif : le rôle doit être un des 6 rôles autorisés
    const validRoles: UserRole[] = [
      "super_admin",
      "admin_cabinet",
      "medecin",
      "secretaire",
      "patient",
      "comptable",
    ];
    if (!validRoles.includes(payload.role)) {
      throw new UnauthorizedException("Rôle utilisateur inconnu");
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
    };
  }
}
