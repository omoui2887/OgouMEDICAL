// ============================================================
// analytics.service.ts — KPIs et indicateurs analytiques
// ============================================================
// Calcule les métriques clés du cabinet sur période glissante :
//  - Revenus (encaissements Mobile Money + espèces)
//  - Consultations, RDV, patients actifs
//  - Taux de recouvrement, taux de présence RDV
//  - Performance équipe médicale
//  - Répartition par commune / spécialité / moyen de paiement
// ============================================================

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/** Période d'analyse. */
export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m" | "ytd";

/** Résultats analytiques agrégés. */
export interface AnalyticsResult {
  period: AnalyticsPeriod;
  from: Date;
  to: Date;
  kpis: {
    revenue: number;
    consultations: number;
    appointments: number;
    newPatients: number;
    activePatients: number;
    collectionRate: number;
    noShowRate: number;
  };
  revenueByMonth: Array<{ month: string; revenue: number }>;
  paymentDistribution: Array<{ method: string; count: number; total: number }>;
  appointmentsByStatus: Array<{ status: string; count: number }>;
  topDoctors: Array<{
    doctorId: string;
    name: string;
    specialty: string | null;
    appointments: number;
    revenue: number;
  }>;
  patientsByCommune: Array<{ commune: string; count: number }>;
}

/**
 * Service analytique MediSaaS CI.
 * Toutes les requêtes agrègent sur un tenant (isolation multi-tenant).
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcule le tableau de bord analytique complet d'un tenant.
   */
  async getDashboard(
    tenantId: string,
    period: AnalyticsPeriod = "30d",
  ): Promise<AnalyticsResult> {
    const { from, to } = this.computePeriodBounds(period);

    const [
      revenueAggregate,
      consultations,
      appointments,
      newPatients,
      activePatients,
      paymentsByMethod,
      appointmentsByStatus,
      topDoctorsRaw,
      patientsByCommuneRaw,
    ] = await Promise.all([
      // Revenus encaissés sur la période
      this.prisma.payment.aggregate({
        where: {
          status: "reussi",
          date: { gte: from, lte: to },
          invoice: { tenantId },
        },
        _sum: { amount: true },
      }),
      this.prisma.consultation.count({
        where: { tenantId, date: { gte: from, lte: to } },
      }),
      this.prisma.appointment.count({
        where: { tenantId, date: { gte: from, lte: to } },
      }),
      this.prisma.patient.count({
        where: { tenantId, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.patient.count({
        where: { tenantId, status: "actif" },
      }),
      this.prisma.payment.groupBy({
        by: ["method"],
        where: { status: "reussi", invoice: { tenantId } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.appointment.groupBy({
        by: ["status"],
        where: { tenantId, date: { gte: from, lte: to } },
        _count: { _all: true },
      }),
      // Performance équipe — besoin du nom du médecin (relation)
      this.prisma.user.findMany({
        where: { tenantId, role: "medecin" },
        select: {
          id: true,
          name: true,
          specialty: true,
          _count: {
            select: {
              appointments: { where: { date: { gte: from, lte: to } } },
            },
          },
        },
      }),
      this.prisma.patient.groupBy({
        by: ["address"],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    // Revenus mensuels (12 derniers mois)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    const monthlyPayments = await this.prisma.payment.findMany({
      where: {
        status: "reussi",
        date: { gte: twelveMonthsAgo },
        invoice: { tenantId },
      },
      select: { amount: true, date: true },
    });

    const revenueByMonth = this.aggregateByMonth(monthlyPayments);

    // Taux de recouvrement (revenus / total facturé)
    const invoiced = await this.prisma.invoice.aggregate({
      where: { tenantId, createdAt: { gte: from, lte: to } },
      _sum: { total: true },
    });
    const collectionRate =
      invoiced._sum.total && invoiced._sum.total > 0
        ? Math.round(
            ((revenueAggregate._sum.amount ?? 0) / invoiced._sum.total) * 10000,
          ) / 100
        : 0;

    // Taux d'absentéisme (absents / total)
    const absent = appointmentsByStatus.find((s) => s.status === "absent")?._count._all ?? 0;
    const noShowRate =
      appointments > 0 ? Math.round((absent / appointments) * 10000) / 100 : 0;

    // Top doctors (avec revenus associés)
    const topDoctors = await Promise.all(
      topDoctorsRaw.map(async (d) => {
        const revenue = await this.prisma.payment.aggregate({
          where: {
            status: "reussi",
            date: { gte: from, lte: to },
            invoice: {
              tenantId,
              patient: { appointments: { some: { doctorId: d.id } } },
            },
          },
          _sum: { amount: true },
        });
        return {
          doctorId: d.id,
          name: d.name,
          specialty: d.specialty,
          appointments: d._count.appointments,
          revenue: revenue._sum.amount ?? 0,
        };
      }),
    );

    return {
      period,
      from,
      to,
      kpis: {
        revenue: revenueAggregate._sum.amount ?? 0,
        consultations,
        appointments,
        newPatients,
        activePatients,
        collectionRate,
        noShowRate,
      },
      revenueByMonth,
      paymentDistribution: paymentsByMethod.map((p) => ({
        method: p.method,
        count: p._count._all,
        total: p._sum.amount ?? 0,
      })),
      appointmentsByStatus: appointmentsByStatus.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      topDoctors: topDoctors.sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      patientsByCommune: patientsByCommuneRaw
        .map((c) => ({ commune: c.address ?? "Inconnue", count: c._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
    };
  }

  /** Calcule les bornes de période (from/to). */
  private computePeriodBounds(period: AnalyticsPeriod): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();
    switch (period) {
      case "7d":
        from.setDate(from.getDate() - 7);
        break;
      case "30d":
        from.setDate(from.getDate() - 30);
        break;
      case "90d":
        from.setDate(from.getDate() - 90);
        break;
      case "12m":
        from.setMonth(from.getMonth() - 12);
        break;
      case "ytd":
        from.setMonth(0);
        from.setDate(1);
        from.setHours(0, 0, 0, 0);
        break;
    }
    return { from, to };
  }

  /** Agrège les paiements par mois (YYYY-MM). */
  private aggregateByMonth(
    payments: Array<{ amount: number; date: Date }>,
  ): Array<{ month: string; revenue: number }> {
    const map = new Map<string, number>();
    for (const p of payments) {
      const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + p.amount);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));
  }
}
