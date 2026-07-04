// ============================================================
// jwt.config.ts — Configuration JSON Web Token
// ============================================================
// Double secret JWT (access + refresh) pour rotation courte des
// tokens d'accès (1h) et refresh longue durée (7j).
// Les secrets DOIVENT être >= 32 caractères en production.
// ============================================================

import { registerAs } from "@nestjs/config";

/**
 * Configuration JWT — utilisée par JwtModule.registerAsync().
 */
export default registerAs("jwt", () => ({
  secret: process.env.JWT_SECRET ?? "dev-jwt-secret-change-me",
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
    issuer: "medisaas-ci",
    audience: "medisaas-ci-users",
  },
}));

/**
 * Configuration refresh token — séparée du token d'accès pour
 * permettre une révocation indépendante.
 */
export const jwtRefreshConfig = registerAs("jwt-refresh", () => ({
  secret: process.env.JWT_REFRESH_SECRET ?? "dev-jwt-refresh-secret-change-me",
  signOptions: {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
    issuer: "medisaas-ci",
    audience: "medisaas-ci-users",
  },
}));
