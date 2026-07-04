import { NextRequest, NextResponse } from "next/server";
import {
  PATIENTS, APPOINTMENTS, PRESCRIPTIONS, INVOICES, CONSULTATIONS,
  TENANT,
} from "@/lib/mock-data";
import { formatFCFA } from "@/lib/types";

// GET /api/patients/[id] — Dossier patient complet
// Retourne : infos patient + statistiques + historique (RDV, ordonnances, factures, consultations)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patient = PATIENTS.find((p) => p.id === id);

  if (!patient) {
    return NextResponse.json(
      { success: false, error: "Patient introuvable" },
      { status: 404 }
    );
  }

  const appointments = APPOINTMENTS.filter((a) => a.patientId === id);
  const prescriptions = PRESCRIPTIONS.filter((p) => p.patientId === id);
  const invoices = INVOICES.filter((i) => i.patientId === id);
  const consultations = CONSULTATIONS.filter((c) =>
    c.patientName === `${patient.firstName} ${patient.lastName}`
  );

  const totalBilled = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.reduce(
    (sum, i) => sum + (i.paidAmount ?? (i.status === "payee" ? i.total : 0)),
    0
  );
  const outstanding = totalBilled - totalPaid;

  const age = (() => {
    const birth = new Date(patient.birthDate);
    const now = new Date();
    let a = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) a--;
    return a;
  })();

  const bmi =
    patient.weight && patient.height
      ? Math.round((patient.weight / Math.pow(patient.height / 100, 2)) * 10) / 10
      : null;

  const lastVisit =
    appointments
      .filter((a) => a.status === "termine")
      .map((a) => a.date)
      .sort()
      .reverse()[0] ?? patient.lastVisit;

  return NextResponse.json({
    success: true,
    tenant: {
      id: TENANT.id,
      name: TENANT.name,
      phone: TENANT.phone,
      email: TENANT.email,
    },
    patient: {
      ...patient,
      age,
      bmi,
      lastVisit,
    },
    stats: {
      appointmentsTotal: appointments.length,
      appointmentsTermine: appointments.filter((a) => a.status === "termine").length,
      appointmentsAVenir: appointments.filter((a) =>
        ["planifie", "confirme", "en_cours"].includes(a.status)
      ).length,
      appointmentsAnnule: appointments.filter((a) => a.status === "annule").length,
      prescriptionsActive: prescriptions.filter((p) => p.status === "active").length,
      prescriptionsTotal: prescriptions.length,
      invoicesImpayees: invoices.filter((i) => i.status === "impayee").length,
      invoicesTotal: invoices.length,
      consultationsTotal: consultations.length,
      totalBilled,
      totalBilledFormatted: formatFCFA(totalBilled),
      totalPaid,
      totalPaidFormatted: formatFCFA(totalPaid),
      outstanding,
      outstandingFormatted: formatFCFA(outstanding),
    },
    history: {
      appointments: appointments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20),
      prescriptions: prescriptions.slice(0, 20),
      invoices: invoices
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20),
      consultations: consultations.slice(0, 20),
    },
  });
}
