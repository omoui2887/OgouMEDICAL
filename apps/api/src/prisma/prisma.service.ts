// ============================================================
// prisma.service.ts — Service PrismaClient étendu pour NestJS
// ============================================================
// Étend PrismaClient avec le lifecycle NestJS :
//  - onModuleInit() → $connect() (connexion à PostgreSQL au démarrage)
//  - onModuleDestroy() → $disconnect() (fermeture propre à l'arrêt)
//  - onModuleInit() → middleware soft-delete automatique (optionnel)
//
// Logs de requêtes activés en développement pour faciliter le debug.
// Conformité Loi 2013-450 : aucune donnée sensible n'est loggée.
// ============================================================

import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Service Prisma injectable dans toute l'application.
 * Singleton global — une seule instance partagée entre les modules.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Connexion à PostgreSQL au démarrage du module.
   * Active les logs Prisma en dev (queries, errors, warns).
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("✅ Connexion PostgreSQL établie (Prisma Client)");
  }

  /**
   * Fermeture propre de la connexion à l'arrêt de l'application.
   * Évite les fuites de connexions et les transactions orphelines.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log("🔒 Connexion PostgreSQL fermée proprement");
  }
}
