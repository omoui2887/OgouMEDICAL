import { NextResponse } from "next/server";
import { PATIENTS, TENANT } from "@/lib/mock-data";

// GET /api/patients/export — Export CSV (BOM UTF-8 pour Excel/Calc)
export async function GET() {
  const headers = [
    "Code",
    "Prénom",
    "Nom",
    "Genre",
    "Date de naissance",
    "Téléphone",
    "Email",
    "Commune",
    "Adresse",
    "Groupe sanguin",
    "Poids (kg)",
    "Taille (cm)",
    "Allergies",
    "Affections chroniques",
    "Assurance",
    "N° assurance",
    "Statut",
    "Dernière visite",
  ];

  const escapeCsv = (val: unknown): string => {
    const s = val === null || val === undefined ? "" : String(val);
    // Échapper les guillemets et entourer de guillemets si nécessaire
    if (/[",\n\r;]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = PATIENTS.map((p) =>
    [
      p.code,
      p.firstName,
      p.lastName,
      p.gender === "M" ? "Masculin" : "Féminin",
      p.birthDate,
      p.phone,
      p.email ?? "",
      p.commune,
      p.address ?? "",
      p.bloodType ?? "",
      p.weight ?? "",
      p.height ?? "",
      p.allergies.join(" | "),
      p.chronicConditions.join(" | "),
      p.insuranceProvider ?? "",
      p.insuranceNumber ?? "",
      p.status === "actif" ? "Actif" : "Inactif",
      p.lastVisit ?? "",
    ]
      .map(escapeCsv)
      .join(";")
  );

  // BOM UTF-8 (\uFEFF) pour qu'Excel/Calc interprète correctement les accents
  const csv = "\uFEFF" + [headers.map(escapeCsv).join(";"), ...rows].join("\r\n");

  const filename = `patients_${TENANT.slug}_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
