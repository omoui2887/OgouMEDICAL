// ============================================================
// billing.controller.ts — Routes /invoices + /payments + webhook
// ============================================================

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UsePipes,
} from "@nestjs/common";
import type { Request } from "express";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BillingService } from "./billing.service";
import { CinetPayService } from "./cinetpay.service";
import {
  CreateInvoiceDto,
  CreateInvoiceSchema,
  InitiatePaymentDto,
  InitiatePaymentSchema,
  CinetPayWebhookSchema,
} from "./dto/billing.dto";
import { PaginationDto, PaginationSchema } from "../../common/dto/pagination.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Audit } from "../../common/interceptors/audit.interceptor";

/**
 * Contrôleur Facturation & Paiements Mobile Money.
 *
 * Routes :
 *  - GET    /invoices            — liste paginée
 *  - GET    /invoices/:id        — détail
 *  - POST   /invoices            — création
 *  - POST   /invoices/:id/pay    — initie un paiement CinetPay
 *  - GET    /billing/stats       — KPIs facturation
 *  - POST   /billing/webhook     — callback CinetPay (public)
 */
@ApiTags("billing")
@Controller()
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly cinetpay: CinetPayService,
  ) {}

  // ───────── FACTURES ─────────

  @Get("invoices")
  @Roles("admin_cabinet", "medecin", "secretaire", "comptable", "patient")
  @Audit("invoice.list", "invoice")
  @ApiOperation({ summary: "Liste paginée des factures" })
  findAll(
    @CurrentTenant() tenantId: string | null,
    @Query(new ZodValidationPipe(PaginationSchema)) pagination: PaginationDto,
    @Query("status") status?: string,
    @Query("method") method?: string,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.billingService.findAll(tenantId, pagination, { status, method });
  }

  @Get("invoices/:id")
  @Roles("admin_cabinet", "medecin", "secretaire", "comptable", "patient")
  @Audit("invoice.view", "invoice")
  @ApiOperation({ summary: "Détail d'une facture" })
  findOne(@CurrentTenant() tenantId: string | null, @Param("id") id: string) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.billingService.findOne(tenantId, id);
  }

  @Post("invoices")
  @Roles("admin_cabinet", "medecin", "secretaire", "comptable")
  @Audit("invoice.create", "invoice")
  @ApiOperation({ summary: "Créer une facture" })
  @UsePipes(new ZodValidationPipe(CreateInvoiceSchema))
  create(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CreateInvoiceDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.billingService.create(tenantId, dto);
  }

  // ───────── PAIEMENTS MOBILE MONEY ─────────

  @Post("invoices/:id/pay")
  @Roles("admin_cabinet", "secretaire", "comptable", "patient")
  @Audit("payment.initiate", "payment")
  @ApiOperation({ summary: "Initier un paiement Mobile Money (CinetPay)" })
  @UsePipes(new ZodValidationPipe(InitiatePaymentSchema))
  initiatePayment(
    @CurrentTenant() tenantId: string | null,
    @Param("id") _id: string,
    @Body() dto: InitiatePaymentDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.billingService.initiatePayment(tenantId, dto);
  }

  // ───────── STATS ─────────

  @Get("billing/stats")
  @Roles("admin_cabinet", "comptable")
  @ApiOperation({ summary: "Statistiques facturation (KPIs)" })
  stats(@CurrentTenant() tenantId: string | null) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.billingService.getStats(tenantId);
  }

  // ───────── WEBHOOK CINETPAY ─────────

  /**
   * Webhook CinetPay — callback serveur après paiement Mobile Money.
   * Route PUBLIQUE (pas de JWT) mais signature vérifiable côté CinetPay.
   */
  @Public()
  @Post("billing/webhook")
  @ApiOperation({ summary: "Webhook CinetPay (callback serveur)" })
  @ApiResponse({ status: 200, description: "Webhook traité (idempotent)" })
  @UsePipes(new ZodValidationPipe(CinetPayWebhookSchema))
  async webhook(@Body() payload: unknown, @Req() _req: Request) {
    const result = await this.cinetpay.handleWebhook(
      payload as Parameters<typeof this.cinetpay.handleWebhook>[0],
    );
    return { received: true, recorded: result.recorded };
  }
}
