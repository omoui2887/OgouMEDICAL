import { NextRequest, NextResponse } from "next/server";
import { APPOINTMENTS, DOCTORS, PATIENTS } from "@/lib/mock-data";

// GET /api/appointments — Liste avec filtres
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const patientId = searchParams.get("patientId");

  let results = [...APPOINTMENTS];
  if (doctorId) results = results.filter((a) => a.doctorId === doctorId);
  if (date) results = results.filter((a) => new Date(a.date).toISOString().slice(0, 10) === date);
  if (status) results = results.filter((a) => a.status === status);
  if (patientId) results = results.filter((a) => a.patientId === patientId);

  return NextResponse.json({ appointments: results, total: results.length });
}

// POST /api/appointments — Création (avec confirmation SMS optionnelle)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId, doctorId, appointmentDate, startTime, endTime,
      type, motif, sendSmsConfirmation,
    } = body;

    // Validation
    if (!patientId || !doctorId || !appointmentDate || !startTime) {
      return NextResponse.json(
        { success: false, error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const patient = PATIENTS.find((p) => p.id === patientId);
    const doctor = DOCTORS.find((d) => d.id === doctorId);
    if (!patient || !doctor) {
      return NextResponse.json(
        { success: false, error: "Patient ou médecin introuvable" },
        { status: 404 }
      );
    }

    // Vérifier conflit (mock : sur les données existantes)
    const conflict = APPOINTMENTS.find(
      (a) =>
        a.doctorId === doctorId &&
        new Date(a.date).toISOString().slice(0, 10) === appointmentDate &&
        a.time === startTime &&
        a.status !== "annule"
    );
    if (conflict) {
      return NextResponse.json(
        { success: false, error: "Créneau déjà occupé" },
        { status: 409 }
      );
    }

    const newApt = {
      id: `apt_${Date.now()}`,
      patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientAvatarColor: patient.avatarColor,
      doctorId,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date: new Date(`${appointmentDate}T${startTime}`).toISOString(),
      time: startTime,
      duration: 30,
      reason: motif ?? "Consultation",
      type: type ?? "consultation",
      status: "planifie" as const,
      commune: patient.commune,
    };

    // En production : insert Prisma + (si sendSmsConfirmation) → Africa's Talking
    // Audit log (Loi 2013-450)

    return NextResponse.json({
      success: true,
      appointment: newApt,
      smsSent: !!sendSmsConfirmation,
      message: sendSmsConfirmation
        ? `RDV créé. SMS de confirmation envoyé à ${patient.phone}`
        : "RDV créé",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
