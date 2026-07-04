// ============================================================
// logging.interceptor.ts — Log structuré de chaque requête HTTP
// ============================================================
// Intercepte toutes les requêtes entrantes, mesure la durée et
// logge (méthode, URL, statut, ms, userId, tenantId).
// En production, les logs sont au format JSON pour ELK/Datadog.
// Aucune donnée médicale n'est loggée (conformité Loi 2013-450).
// ============================================================

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { Request, Response } from "express";

/**
 * Interceptor de logging — appliqué globalement.
 * Logge : METHOD URL → STATUS en Xms (userId/tenantId si auth).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, originalUrl, ip } = request;
    const userAgent = request.get("user-agent") ?? "unknown";
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAt;
          const userId = (request as unknown as { user?: { sub?: string } }).user?.sub;
          const tenantId = (request as unknown as { tenantId?: string }).tenantId;
          this.logger.log(
            `${method} ${originalUrl} → ${response.statusCode} ${durationMs}ms ` +
              `[ip=${ip} ua="${userAgent}" user=${userId ?? "anonymous"} ` +
              `tenant=${tenantId ?? "n/a"}]`,
          );
        },
        error: (error) => {
          const durationMs = Date.now() - startedAt;
          this.logger.error(
            `${method} ${originalUrl} → ERROR ${durationMs}ms [${error?.name ?? "UnknownError"}]`,
          );
        },
      }),
    );
  }
}
