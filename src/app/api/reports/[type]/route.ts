import { NextRequest, NextResponse } from "next/server";
import {
  PATIENTS, APPOINTMENTS, INVOICES, PRESCRIPTIONS, CONSULTATIONS, DOCTORS,
  MONTHLY_REVENUE, PAYMENT_DISTRIBUTION, SPECIALTY_DISTRIBUTION, TENANT,
} from "@/lib/mock-data";
import {
  TOP_DIAGNOSES, PATIENTS_NEW_VS_RECURRING, CONSULTATIONS_BY_TYPE,
  CONSULTATION_HEATMAP,
} from "@/lib/analytics-data";
import { formatFCFA } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["financier", "medical", "frequentation", "epidemiologique"] as const;
type ReportType = (typeof VALID_TYPES)[number];

// GET /api/reports/[type] — Rapports agrégés (4 types)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;

  if (!VALID_TYPES.includes(type as ReportType)) {
    return NextResponse.json(
      {
        success: false,
        error: `Type de rapport invalide. Types valides : ${VALID_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const periodLabel = startDate && endDate
    ? `${startDate} → ${endDate}`
    : "Période courante";

  const base = {
    success: true,
    type,
    period: periodLabel,
    generatedAt: new Date().toISOString(),
    tenant: {
      id: TENANT.id,
      name: TENANT.name,
      city: TENANT.city,
      district: TENANT.district,
    },
  };

  if (type === "financier") {
    const totalBilled = INVOICES.reduce((s, i) => s + i.total, 0);
    const totalPaid = INVOICES.reduce(
      (s, i) => s + (i.paidAmount ?? (i.status === "payee" ? i.total : 0)),
      0
    );
    const outstanding = totalBilled - totalPaid;
    const totalTax = INVOICES.reduce((s, i) => s + i.tax, 0);
    return NextResponse.json({
      ...base,
      title: "Rapport financier",
      summary: {
        totalInvoices: INVOICES.length,
        totalBilled,
        totalBilledFormatted: formatFCFA(totalBilled),
        totalPaid,
        totalPaidFormatted: formatFCFA(totalPaid),
        outstanding,
        outstandingFormatted: formatFCFA(outstanding),
        totalTax,
        totalTaxFormatted: formatFCFA(totalTax),
        avgInvoice: INVOICES.length ? Math.round(totalBilled / INVOICES.length) : 0,
        avgInvoiceFormatted: formatFCFA(INVOICES.length ? Math.round(totalBilled / INVOICES.length) : 0),
      },
      charts: {
        monthlyRevenue: MONTHLY_REVENUE,
        paymentDistribution: PAYMENT_DISTRIBUTION,
      },
      invoices: INVOICES,
    });
  }

  if (type === "medical") {
    return NextResponse.json({
      ...base,
      title: "Rapport médical",
      summary: {
        totalConsultations: CONSULTATIONS.length,
        totalPrescriptions: PRESCRIPTIONS.length,
        activePrescriptions: PRESCRIPTIONS.filter((p) => p.status === "active").length,
        expiredPrescriptions: PRESCRIPTIONS.filter((p) => p.status === "expiree").length,
        totalDoctors: DOCTORS.length,
        totalPatients: PATIENTS.length,
      },
      charts: {
        consultationsByType: CONSULTATIONS_BY_TYPE,
        topDiagnoses: TOP_DIAGNOSES,
        specialtyDistribution: SPECIALTY_DISTRIBUTION,
      },
      consultations: CONSULTATIONS,
      prescriptions: PRESCRIPTIONS,
    });
  }

  if (type === "frequentation") {
    return NextResponse.json({
      ...base,
      title: "Rapport de fréquentation",
      summary: {
        totalAppointments: APPOINTMENTS.length,
        completed: APPOINTMENTS.filter((a) => a.status === "termine").length,
        cancelled: APPOINTMENTS.filter((a) => a.status === "annule").length,
        missed: APPOINTMENTS.filter((a) => a.status === "absent").length,
        completionRate: APPOINTMENTS.length
          ? Math.round((APPOINTMENTS.filter((a) => a.status === "termine").length / APPOINTMENTS.length) * 100)
          : 0,
        noShowRate: APPOINTMENTS.length
          ? Math.round((APPOINTMENTS.filter((a) => a.status === "absent").length / APPOINTMENTS.length) * 100)
          : 0,
      },
      charts: {
        appointmentsTrend: MONTHLY_REVENUE.map((m) => ({
          month: m.month,
          rdv: m.consultations,
        })),
        consultationHeatmap: CONSULTATION_HEATMAP,
        patientsNewVsRecurring: PATIENTS_NEW_VS_RECURRING,
      },
      appointments: APPOINTMENTS,
    });
  }

  // epidemiologique
  return NextResponse.json({
    ...base,
    title: "Rapport épidémiologique",
    summary: {
      totalCases: 0,
      activeCases: 0,
      resolvedCases: 0,
      deaths: 0,
      incidenceRate: 0,
      prevalenceRate: 0,
    },
    charts: {
      topDiagnoses: TOP_DIAGNOSES,
      casesByAgeGroup: [],
      casesByGender: [
        { gender: "Masculin", count: 0 },
        { gender: "Féminin", count: 0 },
      ],
      casesByCommune: [],
      monthlyTrend: MONTHLY_REVENUE.map((m) => ({
        month: m.month,
        cases: 0,
        newCases: 0,
      })),
    },
    alerts: [],
  });
}
