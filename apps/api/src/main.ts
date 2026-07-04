// ============================================================
// main.ts — Bootstrap de l'API NestJS MediSaaS CI
// ============================================================
// Étapes de démarrage (ordre important) :
//  1. ValidationPipe global (whitelist + transform + Zod-compatible)
//  2. Filtre d'erreurs unifié (HttpExceptionFilter)
//  3. Helmet (sécurité headers HTTP — CSP, HSTS, X-Frame-Options...)
//  4. CORS (origines configurées via CORS_ORIGINS)
//  5. Préfixe global "/api"
//  6. Swagger sur /api/docs (désactivé en production)
//  7. Écoute sur process.env.API_PORT ?? 4000
//
// Conformité Loi 2013-450 :
//  - Helmet force HTTPS (HSTS) et bloque les iframe clickjacking
//  - CORS strict (pas de wildcard)
//  - Logs sans données médicales sensibles
//  - Documentation Swagger masquée en production
// ============================================================

import { ValidationPipe, Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { buildSwaggerOptions } from "./config/swagger.config";
import appConfig from "./config/configuration";

/**
 * Point d'entrée de l'API MediSaaS CI.
 * Démarrage : `nest start` ou `bun run dev` (voir apps/api/package.json).
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // Requis pour la vérification de signature des webhooks
  });

  // 1. Helmet — headers de sécurité (CSP, HSTS, X-Frame-Options)
  app.use(
    helmet({
      contentSecurityPolicy:
        appConfig().nodeEnv === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. CORS strict — origines autorisées uniquement (pas de wildcard)
  const config = app.get("ConfigService");
  const corsOrigins = config.get<string[]>("app.corsOrigins") ?? [];
  app.enableCors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Request-ID"],
    credentials: true,
    maxAge: 3600,
  });

  // 3. Préfixe global "/api"
  const apiPrefix = config.get<string>("app.apiPrefix") ?? "api";
  app.setGlobalPrefix(apiPrefix, {
    exclude: [], // toutes les routes sous /api
  });

  // 4. ValidationPipe global — whitelist (strip unknown props) + transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // 5. Filtre d'erreurs unifié — format ApiResponse pour toutes les erreurs
  app.useGlobalFilters(new HttpExceptionFilter());

  // 6. Swagger — /api/docs en dev/staging seulement
  const nodeEnv = config.get<string>("app.nodeEnv");
  if (nodeEnv !== "production") {
    const options = buildSwaggerOptions();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      customSiteTitle: "MediSaaS CI API — Documentation",
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
      },
    });
    logger.log(`📖 Documentation Swagger disponible sur /${apiPrefix}/docs`);
  }

  // 7. Graceful shutdown — app.enableShutdownHooks() pour Prisma onModuleDestroy
  app.enableShutdownHooks();

  // 8. Démarrage du serveur
  const port = config.get<number>("app.apiPort") ?? 4000;
  await app.listen(port);
  logger.log(`🚀 MediSaaS CI API démarrée sur http://localhost:${port}/${apiPrefix}`);
  logger.log(`🌍 Environnement : ${nodeEnv}`);
  logger.log(`🔒 Helmet CORS ValidationPipe FiltreErreur → actifs`);
}

bootstrap().catch((err) => {
  console.error("❌ Échec bootstrap API MediSaaS CI", err);
  process.exit(1);
});

// Export pour les tests E2E (NestJS Testing)
export { AppModule, DocumentBuilder, SwaggerModule };
