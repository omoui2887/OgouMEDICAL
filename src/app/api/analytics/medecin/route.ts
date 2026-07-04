import { NextRequest, NextResponse } from "next/server";
import { DOCTOR_DASHBOARD } from "@/lib/analytics-data";
import { formatFCFA } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/analytics/medecin — Tableau de bord médecin
// Retourne DOCTOR_DASHBOARD (vide au démarrage) avec montants formatés en FCFA.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");

  const data = DOCTOR_DASHBOARD;

  return NextResponse.json({
    success: true,
    doctorId: doctorId ?? null,
    generatedAt: new Date().toISOString(),
    dashboard: {
      todayAgenda: data.todayAgenda,
      waitingPatients: data.waitingPatients,
      stats: {
        ...data.stats,
        consultationsTodayFormatted: `${data.stats.consultationsToday}`,
        consultationsMonthFormatted: `${data.stats.consultationsMonth}`,
        avgDurationMinFormatted: `${data.stats.avgDurationMin} min`,
        patientsTotalFormatted: `${data.stats.patientsTotal}`,
        satisfactionRateFormatted: `${data.stats.satisfactionRate}%`,
      },
      revenue: {
        ...data.revenue,
        monthFormatted: formatFCFA(data.revenue.month),
        consultationsFormatted: formatFCFA(data.revenue.consultations),
        avgPerConsultFormatted: formatFCFA(data.revenue.avgPerConsult),
        variableBonusFormatted: formatFCFA(data.revenue.variableBonus),
      },
      alerts: data.alerts,
    },
  });
}
