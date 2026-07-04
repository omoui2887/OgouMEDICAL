// ============================================================
// billing.module.ts — Facturation + CinetPay (Mobile Money)
// ============================================================

import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { CinetPayService } from "./cinetpay.service";

@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    CinetPayService,
    // Injection de fetch (Node 18+ natif) — facilitant les tests unitaires
    { provide: "FETCH", useValue: fetch },
  ],
  exports: [BillingService, CinetPayService],
})
export class BillingModule {}
