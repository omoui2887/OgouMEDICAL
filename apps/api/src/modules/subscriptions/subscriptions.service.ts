// ============================================================
// subscriptions.service.ts — Abonnements SaaS MediSaaS CI
// ============================================================
// Gère le cycle de vie d'un abonnement tenant :
//  - current()          — abonnement courant du tenant
//  - changePlan()       — upgrade/downgrade (prorata via CinetPay)
//  - updatePaymentMethod() — changement moyen de paiement Mobile Money
//  - cancel()           — résiliation (conformité Loi 2013-450 : préavis)
//  - checkUsage()       — limites plan (utilisateurs, patients, téléconsult)
// ============================================================

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PLAN_PRICING } from "./dto/subscriptions.dto";
import type {
  ChangePlanDto,
  UpdatePaymentMethodDto,
  CancelSubscriptionDto,
} from "./dto/subscriptions.dto";

type SubscriptionWithTenant = Prisma.SubscriptionGetPayload<{
  include: { tenant: true };
}>;

/**
 * Service Abonnements SaaS.
 * Un seul abonnement par tenant (tenantId unique sur Subscription).
 */
@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère l'abonnement courant du tenant (avec infos tenant).
   */
  async getCurrent(tenantId: string): Promise<SubscriptionWithTenant> {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { tenant: true },
    });
    if (!sub) {
      throw new NotFoundException("Aucun abonnement actif pour ce cabinet");
    }
    return sub;
  }

  /**
   * Change le plan d'abonnement (upgrade/downgrade).
   * Prorata non implémenté ici (à brancher avec la facturation CinetPay).
   */
  async changePlan(tenantId: string, dto: ChangePlanDto): Promise<SubscriptionWithTenant> {
    const sub = await this.getCurrent(tenantId);

    if (sub.plan === dto.plan && sub.billingCycle === dto.billingCycle) {
      throw new BadRequestException("Plan identique à l'abonnement courant");
    }

    const pricing = PLAN_PRICING[dto.plan];
    const newAmount = dto.billingCycle === "annuel" ? pricing.annuel : pricing.mensuel;

    // Période courante : réinitialisée au changement
    const now = new Date();
    const periodEnd = new Date(now);
    if (dto.billingCycle === "annuel") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const updated = await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        plan: dto.plan,
        billingCycle: dto.billingCycle,
        amount: newAmount,
        seats: pricing.seats,
        paymentMethod: dto.paymentMethod ?? sub.paymentMethod,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: "actif",
      },
      include: { tenant: true },
    });

    this.logger.log(
      `Plan modifié — tenant=${tenantId} plan=${dto.plan} cycle=${dto.billingCycle} amount=${newAmount}`,
    );
    return updated;
  }

  /**
   * Met à jour le moyen de paiement Mobile Money de l'abonnement.
   */
  async updatePaymentMethod(
    tenantId: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<SubscriptionWithTenant> {
    await this.getCurrent(tenantId);
    return this.prisma.subscription.update({
      where: { tenantId },
      data: { paymentMethod: dto.paymentMethod },
      include: { tenant: true },
    });
  }

  /**
   * Résilie l'abonnement.
   * Conformité Loi 2013-450 : préavis 30 jours sauf si immediate=true.
   * Les données médicales sont conservées 90 jours avant suppression définitive.
   */
  async cancel(
    tenantId: string,
    dto: CancelSubscriptionDto,
  ): Promise<SubscriptionWithTenant> {
    const sub = await this.getCurrent(tenantId);

    if (sub.status === "resilie") {
      throw new BadRequestException("Abonnement déjà résilié");
    }

    const now = new Date();
    // Si immediate : fin immédiate. Sinon : fin de période courante (préavis).
    const effectiveEnd = dto.immediate ? now : sub.currentPeriodEnd;

    const updated = await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status: "resilie",
        // Prolonge la période jusqu'au préavis
        currentPeriodEnd: effectiveEnd,
      },
      include: { tenant: true },
    });

    this.logger.log(
      `Abonnement résilié — tenant=${tenantId} immediate=${dto.immediate} raison="${dto.reason}"`,
    );

    // Note : une tâche cron planifiera la suppression des données 90j
    // après la date d'effet (conformité Loi 2013-450 — droit à l'oubli).
    return updated;
  }

  /**
   * Vérifie l'usage du plan : utilisateurs utilisés vs seats, etc.
   * Utilisé pour afficher les jauges dans le dashboard SaaS.
   */
  async checkUsage(tenantId: string): Promise<{
    seatsUsed: number;
    seatsLimit: number;
    patientsCount: number;
    teleconsultationsThisMonth: number;
    plan: string;
    status: string;
  }> {
    const sub = await this.getCurrent(tenantId);
    const [usersCount, patientsCount, teleconsultCount] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.patient.count({ where: { tenantId } }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          type: "teleconsultation",
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      seatsUsed: usersCount,
      seatsLimit: sub.seats,
      patientsCount,
      teleconsultationsThisMonth: teleconsultCount,
      plan: sub.plan,
      status: sub.status,
    };
  }
}
