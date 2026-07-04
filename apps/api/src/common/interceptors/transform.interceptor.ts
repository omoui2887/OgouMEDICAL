// ============================================================
// transform.interceptor.ts — Formatage unifié ApiResponse<T>
// ============================================================
// Toute réponse réussie est enveloppée dans le format :
// {
//   success: true,
//   data: T,
//   statusCode: 200,
//   timestamp: ISO,
//   path: "/api/..."
// }
//
// Cela permet au frontend Next.js de toujours consommer le même
// contrat, quel que soit le endpoint. Conforme à @medisaas/shared-types.
// ============================================================

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";
import type { Request } from "express";
import type { ApiResponse } from "../../../../packages/shared-types/src";

/**
 * Interceptor de transformation — appliqué globalement.
 * Enveloppe la valeur retournée par le handler dans ApiResponse<T>.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const statusCode = ctx.getResponse<{ statusCode: number }>().statusCode;

    return next.handle().pipe(
      map((data) => {
        // Si déjà au format ApiResponse (ex: paginate), on passe tel quel
        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          "statusCode" in data
        ) {
          return data as ApiResponse<T>;
        }

        return {
          success: true,
          data,
          statusCode,
          timestamp: new Date().toISOString(),
          path: request.originalUrl,
        } satisfies ApiResponse<T>;
      }),
    );
  }
}
