import { NextResponse } from "next/server";
import {
  APPOINTMENTS, PATIENTS, INVOICES, PRESCRIPTIONS, DOCTORS,
  MONTHLY_REVENUE, PAYMENT_DISTRIBUTION, SPECIALTY_DISTRIBUTION,
  APPOINTMENTS_TREND,
} from "@/lib/mock-data";
import { formatFCFA } from "@/lib/types";

export const dynamic = "force-static";

export async function GET() {
  const today = new Date();
  const todayAppointments = APPOINTMENTS.filter((a) => {
    const d = new Date(a.date);
    return d.toDateString() === today.toDateString();
  }).length;

  const activePatients = PATIENTS.filter((p) => p.status === "actif").length;
  const totalRevenue = INVOICES
    .filter((i) => i.status === "payee")
    .reduce((s, i) => s + (i.paidAmount ?? i.total), 0);
  const monthlyRevenue = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue;
  const previousMonthRevenue = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2].revenue;
  const revenueGrowth = (((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1);

  const completedToday = APPOINTMENTS.filter((a) => {
    const d = new Date(a.date);
    return d.toDateString() === today.toDateString() && a.status === "termine";
  }).length;

  return NextResponse.json({
    kpis: {
      todayAppointments,
      completedToday,
      activePatients,
      totalPatients: PATIENTS.length,
      totalRevenue,
      totalRevenueFormatted: formatFCFA(totalRevenue),
      monthlyRevenue,
      monthlyRevenueFormatted: formatFCFA(monthlyRevenue),
      revenueGrowth: parseFloat(revenueGrowth),
      pendingInvoices: INVOICES.filter((i) => i.status === "impayee").length,
      activePrescriptions: PRESCRIPTIONS.filter((p) => p.status === "active").length,
      doctors: DOCTORS.length,
    },
    monthlyRevenue: MONTHLY_REVENUE,
    paymentDistribution: PAYMENT_DISTRIBUTION,
    specialtyDistribution: SPECIALTY_DISTRIBUTION,
    appointmentsTrend: APPOINTMENTS_TREND,
    recentAppointments: APPOINTMENTS.slice(0, 6),
  });
}
