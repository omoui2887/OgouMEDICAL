import { NextResponse } from "next/server";
import {
  PATIENTS, APPOINTMENTS, INVOICES, PRESCRIPTIONS, DOCTORS, CONSULTATIONS,
  MONTHLY_REVENUE, PAYMENT_DISTRIBUTION, SPECIALTY_DISTRIBUTION,
  APPOINTMENTS_TREND, TENANT,
} from "@/lib/mock-data";
import {
  CONSULTATION_HEATMAP, PATIENTS_NEW_VS_RECURRING, CONSULTATIONS_BY_TYPE,
  TOP_DIAGNOSES, CABINET_ALERTS, RECENT_ACTIVITIES,
} from "@/lib/analytics-data";
import { formatFCFA } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/analytics/cabinet — Tableau de bord analytique du cabinet
// Retourne KPIs + données graphiques + listes (les données mock sont vides au démarrage).
export async function GET() {
  const today = new Date();
  const todayStr = today.toDateString();

  const totalRevenue = INVOICES
    .filter((i) => i.status === "payee")
    .reduce((s, i) => s + (i.paidAmount ?? i.total), 0);

  const outstanding = INVOICES
    .filter((i) => i.status !== "payee" && i.status !== "annulee")
    .reduce((s, i) => s + (i.total - (i.paidAmount ?? 0)), 0);

  const kpis = {
    totalPatients: PATIENTS.length,
    activePatients: PATIENTS.filter((p) => p.status === "actif").length,
    newPatientsThisMonth: 0,
    totalDoctors: DOCTORS.length,
    totalConsultations: CONSULTATIONS.length,
    todayAppointments: APPOINTMENTS.filter((a) => new Date(a.date).toDateString() === todayStr).length,
    completedToday: APPOINTMENTS.filter(
      (a) => new Date(a.date).toDateString() === todayStr && a.status === "termine"
    ).length,
    totalRevenue,
    totalRevenueFormatted: formatFCFA(totalRevenue),
    outstanding,
    outstandingFormatted: formatFCFA(outstanding),
    activePrescriptions: PRESCRIPTIONS.filter((p) => p.status === "active").length,
    pendingInvoices: INVOICES.filter((i) => i.status === "impayee").length,
    avgConsultationDurationMin: 0,
    satisfactionRate: 0,
  };

  return NextResponse.json({
    success: true,
    tenant: {
      id: TENANT.id,
      name: TENANT.name,
      city: TENANT.city,
      district: TENANT.district,
    },
    generatedAt: new Date().toISOString(),
    kpis,
    charts: {
      monthlyRevenue: MONTHLY_REVENUE,
      paymentDistribution: PAYMENT_DISTRIBUTION,
      specialtyDistribution: SPECIALTY_DISTRIBUTION,
      appointmentsTrend: APPOINTMENTS_TREND,
      consultationHeatmap: CONSULTATION_HEATMAP,
      patientsNewVsRecurring: PATIENTS_NEW_VS_RECURRING,
      consultationsByType: CONSULTATIONS_BY_TYPE,
      topDiagnoses: TOP_DIAGNOSES,
    },
    lists: {
      alerts: CABINET_ALERTS,
      recentActivities: RECENT_ACTIVITIES,
      topPatients: [],
      upcomingAppointments: APPOINTMENTS.filter((a) =>
        ["planifie", "confirme"].includes(a.status)
      ).slice(0, 10),
    },
  });
}
