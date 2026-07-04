// ============================================================
// http-exception.filter.ts — Filtre d'erreurs HTTP unifié
// ============================================================
// Capture toutes les exceptions NestJS et les formate en :
// {
//   success: false,
//   error: { code, details },
//   message: string,
//   statusCode: number,
//   timestamp: ISO,
//   path: "/api/..."
// }
//
// Logge les erreurs 5xx pour monitoring (Sentry). Conformité Loi
// 2013-450 : jamais de données médicales dans les messages d'erreur.
// ============================================================

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import type { ApiResponse } from "../../../../packages/shared-types/src";

/**
 * Filtre global — capture HttpException et exceptions génériques.
 * @UseGlobalFilters() appliqué dans main.ts.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extraction du message + code + détails
    let message = "Une erreur interne est survenue. Veuillez réessayer.";
    let errorCode = "INTERNAL_ERROR";
    let details: unknown = undefined;

    if (isHttpException) {
      const exResponse = exception.getResponse();
      if (typeof exResponse === "string") {
        message = exResponse;
      } else if (typeof exResponse === "object" && exResponse !== null) {
        const r = exResponse as Record<string, unknown>;
        message = (r.message as string | string[] | undefined) as unknown as string;
        // ValidationPipe renvoie un tableau de messages — on concatène
        if (Array.isArray(r.message)) {
          message = r.message.join(" ; ");
          errorCode = "VALIDATION_ERROR";
        }
        details = r.error ?? r.details;
      }
    } else if (exception instanceof Error) {
      // En dev, on logge le stack ; en prod, on masque le détail technique
      message =
        process.env.NODE_ENV === "production"
          ? "Erreur interne du serveur"
          : exception.message;
      this.logger.error(
        `Erreur non-HTTP — ${exception.name}: ${exception.message}`,
        exception.stack,
      );
    }

    // Logging des 5xx pour alerting Sentry/Datadog
    if (statusCode >= 500) {
      this.logger.error(
        `5xx — ${request.method} ${request.originalUrl} → ${statusCode} [${errorCode}] ${message}`,
      );
    }

    const payload: ApiResponse = {
      success: false,
      error: { code: errorCode, details },
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    };

    response.status(statusCode).json(payload);
  }
}
