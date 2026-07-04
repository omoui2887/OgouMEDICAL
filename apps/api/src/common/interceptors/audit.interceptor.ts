// ============================================================
// audit.interceptor.ts — Journal d'audit (Loi ivoirienne 2013-450)
// ============================================================
// Enregistre chaque action sensible (consultation, ordonnance,
// facture, accès DPN...) dans la table AuditLog.
//
// Conformité Loi n°2013-450 :
//  - Article 33 : traceabilité des accès aux données personnelles
//  - Article 44 : conservation des logs minimum 12 mois
//  - Article 51 : responsabilité du responsable de traitement
//
// Le décorateur @Audit('action', 'entity') active l'audit sur une
// route. Sans décorateur, l'interceptor n'écrit rien (pas de bruit).
// ============================================================

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import type { JwtPayload } from "../../../../packages/shared-types/src";

/** Clé metadata posée par @Audit(). */
export const AUDIT_KEY = "audit";

/** Métadonnées d'audit posées par @Audit(action, entity?). */
export interface AuditMeta {
  action: string;
  entity?: string;
}

/**
 * Décorateur @Audit() — active la journalisation d'audit sur une route.
 *
 * @example
 * @Audit('patient.view', 'patient')
 * @Get(':id')
 * findOne(@Param('id') id: string) { ... }
 */
export const Audit = (action: string, entity?: string) =>
  Reflect.metadata(AUDIT_KEY, { action, entity } satisfies AuditMeta);

/**
 * Interceptor d'audit — appliqué globalement. Lit la metadata
 * @Audit() et, si présente, écrit une ligne dans AuditLog après
 * succès du handler. Capture userId, tenantId, IP, user-agent.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditMeta = this.reflector.get<AuditMeta>(AUDIT_KEY, context.getHandler());

    // Pas de @Audit() → on ne journalise pas (route non-sensible)
    if (!auditMeta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as unknown as { user?: JwtPayload }).user;
    const tenantId = (request as unknown as { tenantId?: string | null }).tenantId ?? null;

    // Capture de l'ID d'entité (params) pour l'audit
    const params = request.params ?? {};
    const entityId = (params.id as string | undefined) ?? null;

    return next.handle().pipe(
      tap(async (responsePayload: unknown) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              tenantId,
              userId: user?.sub ?? null,
              action: auditMeta.action,
              entity: auditMeta.entity ?? null,
              entityId,
              ip: request.ip ?? null,
              userAgent: request.get("user-agent") ?? null,
              // On ne stocke que des métadonnées (jamais le corps médical)
              metadata: JSON.stringify({
                method: request.method,
                url: request.originalUrl,
                // Pour les créations, on capture le nouvel ID si présent
                resultId:
                  typeof responsePayload === "object" && responsePayload !== null
                    ? ((responsePayload as Record<string, unknown>).id as string | undefined)
                    : undefined,
              }),
            },
          });
        } catch (err) {
          // L'audit ne doit JAMAIS casser la requête utilisateur
          this.logger.error(
            `Échec écriture AuditLog — action=${auditMeta.action} err=${(err as Error).message}`,
          );
        }
      }),
    );
  }
}
