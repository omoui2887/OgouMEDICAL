import { NextRequest, NextResponse } from "next/server";
import { CONSULTATIONS, PATIENTS, DOCTORS, TENANT } from "@/lib/mock-data";
import { type Consultation } from "@/lib/types";

// GET /api/consultations — Liste des consultations
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const doctorId = searchParams.get("doctorId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let results = [...CONSULTATIONS];
  if (patientId) {
    const patient = PATIENTS.find((p) => p.id === patientId);
    if (patient) {
      const fullName = `${patient.firstName} ${patient.lastName}`;
      results = results.filter((c) => c.patientName === fullName);
    }
  }
  if (doctorId) {
    const doctor = DOCTORS.find((d) => d.id === doctorId);
    if (doctor) {
      results = results.filter((c) => c.doctorName === doctor.name);
    }
  }
  if (startDate) {
    results = results.filter((c) => new Date(c.date) >= new Date(startDate));
  }
  if (endDate) {
    results = results.filter((c) => new Date(c.date) <= new Date(endDate));
  }

  return NextResponse.json({
    success: true,
    consultations: results,
    total: results.length,
    tenant: {
      id: TENANT.id,
      name: TENANT.name,
    },
  });
}

// POST /api/consultations — Crée une consultation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId, patientName, doctorId, doctorName, date,
      symptoms, diagnosis, treatment, vitals,
    } = body;

    // Validation des champs obligatoires
    if (!patientName || !doctorName || !date) {
      return NextResponse.json(
        { success: false, error: "Champs requis : patientName, doctorName, date" },
        { status: 400 }
      );
    }
    if (!symptoms || !diagnosis) {
      return NextResponse.json(
        { success: false, error: "Symptômes et diagnostic requis" },
        { status: 400 }
      );
    }

    // Résolution patient/médecin (optionnel)
    if (patientId) {
      const patient = PATIENTS.find((p) => p.id === patientId);
      if (!patient) {
        return NextResponse.json(
          { success: false, error: "Patient introuvable" },
          { status: 404 }
        );
      }
    }
    if (doctorId) {
      const doctor = DOCTORS.find((d) => d.id === doctorId);
      if (!doctor) {
        return NextResponse.json(
          { success: false, error: "Médecin introuvable" },
          { status: 404 }
        );
      }
    }

    const newConsultation: Consultation = {
      id: `consult_${Date.now()}`,
      patientName,
      doctorName,
      date,
      symptoms,
      diagnosis,
      treatment: treatment ?? "",
      vitals: {
        temp: vitals?.temp,
        tension: vitals?.tension,
        pulse: vitals?.pulse,
        weight: vitals?.weight,
      },
    };

    // En production : insert Prisma + audit log (Loi 2013-450) + déclenchement ordonnance si besoin

    return NextResponse.json({
      success: true,
      message: "Consultation enregistrée",
      consultation: newConsultation,
      audit: {
        action: "consultation.create",
        timestamp: new Date().toISOString(),
        tenantId: TENANT.id,
        law: "Loi 2013-450 — traceur dans le registre des traitements",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création de la consultation" },
      { status: 500 }
    );
  }
}
