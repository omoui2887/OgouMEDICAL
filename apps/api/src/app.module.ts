// ============================================================
// app.module.ts — Module racine de l'API MediSaaS CI
// ============================================================
// Imports : ConfigModule + PrismaModule + tous les modules métier.
// Guards globaux : JwtAuthGuard, TenantGuard, RolesGuard (déclarés
// dans AuthModule via APP_GUARD).
// Interceptors globaux : LoggingInterceptor, AuditInterceptor,
// TransformInterceptor (déclarés ici via APP_INTERCEPTOR).
// ============================================================

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

// Configuration
import appConfig from "./config/configuration";
import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";

// Prisma
import { PrismaModule } from "./prisma/prisma.module";

// Common (interceptors globaux)
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

// Modules métier
import { AuthModule } from "./modules/auth/auth.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { MedicalRecordsModule } from "./modules/medical-records/medical-records.module";
import { BillingModule } from "./modules/billing/billing.module";
import { TeleconsultationModule } from "./modules/teleconsultation/teleconsultation.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { AuditModule } from "./modules/audit/audit.module";

/**
 * Module racine — assemble la configuration et tous les modules métier.
 */
@Module({
  imports: [
    // Configuration centralisée (.env validé)
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, jwtConfig],
    }),
    // Rate-limiting global (10 req/sec/IP par défaut)
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
      {
        // Limite stricte sur /auth/login (10 tentatives/min)
        name: "auth",
        ttl: 60_000,
        limit: 10,
      },
    ]),
    // Tâches planifiées (crons : rappels RDV, archivage audit, etc.)
    ScheduleModule.forRoot(),
    // Prisma — global
    PrismaModule,
    // Modules métier
    AuthModule,
    PatientsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    BillingModule,
    TeleconsultationModule,
    NotificationsModule,
    AnalyticsModule,
    SubscriptionsModule,
    AuditModule,
  ],
  providers: [
    // Rate-limiting global
    { provide: "APP_GUARD", useClass: ThrottlerGuard },
    // Interceptors globaux (ordre important : log → audit → transform)
    { provide: "APP_INTERCEPTOR", useClass: LoggingInterceptor },
    { provide: "APP_INTERCEPTOR", useClass: AuditInterceptor },
    { provide: "APP_INTERCEPTOR", useClass: TransformInterceptor },
  ],
})
export class AppModule {}
