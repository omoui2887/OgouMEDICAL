// ============================================================
// auth.module.ts — Module d'authentification
// ============================================================

import { Module } from "@nestjs/common";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";

/**
 * Module Auth — enregistre :
 *  - JwtModule (access token, 1h)
 *  - JwtModule nommé "JWT_REFRESH" (refresh token, 7j)
 *  - JwtStrategy (Passport)
 *  - Guards globaux : JwtAuthGuard + TenantGuard + RolesGuard
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("app.jwt.secret"),
        signOptions: {
          expiresIn: config.get<string>("app.jwt.expiresIn") ?? "1h",
          issuer: "medisaas-ci",
          audience: "medisaas-ci-users",
        },
      }),
    }),
    // Refresh token — instance JwtService séparée avec secret + TTL dédiés
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("app.jwt.refreshSecret"),
        signOptions: {
          expiresIn: config.get<string>("app.jwt.refreshExpiresIn") ?? "7d",
          issuer: "medisaas-ci",
          audience: "medisaas-ci-users",
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Guards globaux — activés sur toutes les routes par défaut
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Alias JwtService "refresh" pour injection @Inject('JWT_REFRESH')
    {
      provide: "JWT_REFRESH",
      useFactory: (config: ConfigService) =>
        new JwtService({
          secret: config.get<string>("app.jwt.refreshSecret"),
          signOptions: {
            expiresIn: config.get<string>("app.jwt.refreshExpiresIn") ?? "7d",
            issuer: "medisaas-ci",
            audience: "medisaas-ci-users",
          },
        }),
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, JwtService],
})
export class AuthModule {}
