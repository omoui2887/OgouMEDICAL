// ============================================================
// analytics.controller.ts — Routes /analytics
// ============================================================

import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AnalyticsService, type AnalyticsPeriod } from "./analytics.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

/**
 * Contrôleur Analytique.
 * @Roles : admin_cabinet (son cabinet), super_admin (tous cabinets).
 */
@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Tableau de bord analytique complet sur période glissante.
   */
  @Get("dashboard")
  @Roles("admin_cabinet", "comptable")
  @ApiOperation({ summary: "Tableau de bord analytique (KPIs, charts)" })
  getDashboard(
    @CurrentTenant() tenantId: string | null,
    @Query("period") period: AnalyticsPeriod = "30d",
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.analyticsService.getDashboard(tenantId, period);
  }
}
