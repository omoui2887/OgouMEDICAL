// ============================================================
// subscriptions.controller.ts — Routes /subscriptions
// ============================================================

import { Body, Controller, Get, Patch, Post, UsePipes } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import {
  CancelSubscriptionDto,
  CancelSubscriptionSchema,
  ChangePlanDto,
  ChangePlanSchema,
  UpdatePaymentMethodDto,
  UpdatePaymentMethodSchema,
} from "./dto/subscriptions.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Audit } from "../../common/interceptors/audit.interceptor";

/**
 * Contrôleur Abonnements SaaS.
 * @Roles : admin_cabinet (gestion complète) + super_admin (oversight).
 */
@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get("current")
  @Roles("admin_cabinet", "super_admin")
  @Audit("subscription.view", "subscription")
  @ApiOperation({ summary: "Abonnement courant du cabinet" })
  getCurrent(@CurrentTenant() tenantId: string | null) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.subscriptionsService.getCurrent(tenantId);
  }

  @Get("usage")
  @Roles("admin_cabinet", "super_admin")
  @ApiOperation({ summary: "Utilisation courante vs limites du plan" })
  checkUsage(@CurrentTenant() tenantId: string | null) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.subscriptionsService.checkUsage(tenantId);
  }

  @Post("change-plan")
  @Roles("admin_cabinet", "super_admin")
  @Audit("subscription.change_plan", "subscription")
  @ApiOperation({ summary: "Changer de plan SaaS (upgrade/downgrade)" })
  @UsePipes(new ZodValidationPipe(ChangePlanSchema))
  changePlan(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: ChangePlanDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.subscriptionsService.changePlan(tenantId, dto);
  }

  @Patch("payment-method")
  @Roles("admin_cabinet", "super_admin")
  @Audit("subscription.update_payment", "subscription")
  @ApiOperation({ summary: "Modifier le moyen de paiement Mobile Money" })
  @UsePipes(new ZodValidationPipe(UpdatePaymentMethodSchema))
  updatePaymentMethod(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.subscriptionsService.updatePaymentMethod(tenantId, dto);
  }

  @Post("cancel")
  @Roles("admin_cabinet", "super_admin")
  @Audit("subscription.cancel", "subscription")
  @ApiOperation({ summary: "Résilier l'abonnement (préavis Loi 2013-450)" })
  @UsePipes(new ZodValidationPipe(CancelSubscriptionSchema))
  cancel(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CancelSubscriptionDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.subscriptionsService.cancel(tenantId, dto);
  }
}
