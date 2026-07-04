// ============================================================
// current-tenant.decorator.ts — @CurrentTenant() extrait tenantId
// ============================================================
// Récupère le tenantId du JWT pour isoler les données par cabinet.
// TenantGuard garantit que req.tenantId est toujours défini pour
// les routes non-publiques.
// ============================================================

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * Extrait l'identifiant du tenant (cabinet) depuis le JWT.
 * Retourne null pour super_admin (accès multi-tenant).
 *
 * @example
 * @Get()
 @UseGuards(JwtAuthGuard, TenantGuard)
 * list(@CurrentTenant() tenantId: string) {
 *   return this.patientsService.findAll(tenantId);
 * }
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return (request.user?.tenantId as string | null) ?? null;
  },
);
