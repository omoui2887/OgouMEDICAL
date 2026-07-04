// ============================================================
// audit.controller.ts — Routes /audit (conformité Loi 2013-450)
// ============================================================

import { Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { PaginationDto, PaginationSchema } from "../../common/dto/pagination.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";

/**
 * Contrôleur Audit — accès restreint admin_cabinet + super_admin.
 *
 * Routes :
 *  - GET /audit/logs      — liste paginée (filtres user/action/entity/date)
 *  - GET /audit/export    — export CSV sur période (conformité ARTCI)
 */
@ApiTags("audit")
@Controller("audit")
@Roles("admin_cabinet", "super_admin")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Liste paginée des entrées d'audit.
   */
  @Get("logs")
  @ApiOperation({ summary: "Journal d'audit paginé (Loi 2013-450)" })
  findAll(
    @CurrentTenant() tenantId: string | null,
    @Query(new ZodValidationPipe(PaginationSchema)) pagination: PaginationDto,
    @Query("userId") userId?: string,
    @Query("action") action?: string,
    @Query("entity") entity?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.auditService.findAll(tenantId, pagination, {
      userId,
      action,
      entity,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  /**
   * Export CSV du journal d'audit sur une période.
   * Conformité ARTCI — droit d'accès et de rectification (art. 33).
   */
  @Get("export")
  @ApiOperation({ summary: "Export CSV du journal d'audit" })
  async export(
    @CurrentTenant() tenantId: string | null,
    @Query("from") from: string,
    @Query("to") to: string,
    @Res() res: Response,
  ): Promise<void> {
    const entries = await this.auditService.exportRange(
      tenantId,
      new Date(from),
      new Date(to),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-medisaas-${from}-${to}.csv"`,
    );

    // En-têtes CSV
    const headers = [
      "createdAt",
      "tenantId",
      "userId",
      "action",
      "entity",
      "entityId",
      "ip",
      "userAgent",
      "metadata",
    ];
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const rows = entries.map((e) =>
      [e.createdAt.toISOString(), e.tenantId, e.userId, e.action, e.entity, e.entityId, e.ip, e.userAgent, e.metadata]
        .map(escape)
        .join(","),
    );

    res.send([headers.join(","), ...rows].join("\n"));
  }
}
