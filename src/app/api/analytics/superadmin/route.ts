import { NextResponse } from "next/server";
import {
  SUPER_ADMIN_STATS, PLAN_DISTRIBUTION, MRR_TREND, CI_CABINS,
} from "@/lib/analytics-data";
import { formatFCFA } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/analytics/superadmin — Tableau de bord super administrateur (SaaS)
// Retourne SUPER_ADMIN_STATS + PLAN_DISTRIBUTION + MRR_TREND + CI_CABINS
export async function GET() {
  const stats = SUPER_ADMIN_STATS;

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    stats: {
      ...stats,
      mrrFormatted: formatFCFA(stats.mrr),
      arrFormatted: formatFCFA(stats.arr),
      churnRateFormatted: `${stats.churnRate}%`,
      uptimeFormatted: `${stats.uptime}%`,
    },
    planDistribution: PLAN_DISTRIBUTION.map((p) => ({
      ...p,
      revenueFormatted: formatFCFA(p.revenue),
    })),
    mrrTrend: MRR_TREND.map((m) => ({
      ...m,
      mrrFormatted: formatFCFA(m.mrr),
    })),
    ciCabins: CI_CABINS,
  });
}
