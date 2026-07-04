import { NextRequest, NextResponse } from "next/server";
import { TENANT, DOCTORS, PATIENTS, APPOINTMENTS } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/types";

// POST /api/supabase/seed — Initialise les données de démonstration (tenant + users + patients)
// En production : exécute supabase/seed.sql via Supabase CLI ou client service role.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const force = Boolean(body?.force);

    if (force) {
      // En production : TRUNCATE puis re-seed
    }

    // Seed simulé — en prod, exécuter le script supabase/seed.sql
    const seeded = {
      tenant: {
        id: TENANT.id,
        name: TENANT.name,
        slug: TENANT.slug,
        type: TENANT.type,
        city: TENANT.city,
        district: TENANT.district,
        phone: TENANT.phone,
        email: TENANT.email,
        address: TENANT.address,
        codePrefix: "OG",
        plan: "essentiel",
        status: "essai",
      },
      users: [
        {
          email: "admin@ogoumedical.ci",
          role: "admin_cabinet",
          name: "Romain OGOU",
          phone: TENANT.phone,
        },
        ...DOCTORS.slice(0, 3).map((d) => ({
          email: d.email,
          role: "medecin" as const,
          name: d.name,
          phone: d.phone,
        })),
      ],
      patients: PATIENTS.slice(0, 10).map((p, i) => ({
        code: `OG-${String(i + 1).padStart(4, "0")}`,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        commune: p.commune,
        status: p.status,
      })),
      appointments: APPOINTMENTS.slice(0, 5).map((a) => ({
        id: a.id,
        patientName: a.patientName,
        doctorName: a.doctorName,
        date: a.date,
        time: a.time,
        status: a.status,
      })),
    };

    return NextResponse.json({
      success: true,
      message: force
        ? "Base réinitialisée avec les données de démonstration"
        : "Données de démonstration initialisées",
      seededAt: new Date().toISOString(),
      counts: {
        tenants: 1,
        users: seeded.users.length,
        patients: seeded.patients.length,
        appointments: seeded.appointments.length,
      },
      sample: {
        tenant: seeded.tenant,
        firstUser: seeded.users[0],
        firstPatient: seeded.patients[0] ?? null,
      },
      note: "En production, cette route exécute supabase/seed.sql via le client service role Supabase.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'initialisation des données" },
      { status: 500 }
    );
  }
}

// GET /api/supabase/seed — Aperçu du contenu qui serait inséré
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Aperçu des données de démonstration (aucune insertion effectuée)",
    preview: {
      tenant: {
        name: TENANT.name,
        plan: "essentiel",
        planPriceFormatted: formatFCFA(15000),
      },
      users: 4,
      patients: Math.min(PATIENTS.length, 10),
      appointments: Math.min(APPOINTMENTS.length, 5),
    },
    hint: "Utilisez POST /api/supabase/seed pour exécuter l'initialisation.",
  });
}
