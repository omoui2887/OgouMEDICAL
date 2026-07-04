import { NextRequest, NextResponse } from "next/server";
import { PRESCRIPTIONS, TENANT } from "@/lib/mock-data";
import { formatDate } from "@/lib/types";

// POST /api/prescriptions/[id]/pdf — Génère les données nécessaires au PDF d'ordonnance
// Le PDF est ensuite rendu côté client (react-pdf ou jsPDF) avec ces données structurées.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prescription = PRESCRIPTIONS.find((p) => p.id === id);

  if (!prescription) {
    return NextResponse.json(
      { success: false, error: "Ordonnance introuvable" },
      { status: 404 }
    );
  }

  if (prescription.status === "annulee") {
    return NextResponse.json(
      { success: false, error: "Ordonnance annulée — PDF non généré" },
      { status: 422 }
    );
  }

  const validityEnd = new Date(prescription.date);
  validityEnd.setDate(validityEnd.getDate() + prescription.validityDays);

  // Données structurées pour le rendu PDF
  const pdfData = {
    meta: {
      documentType: "Ordonnance médicale",
      number: prescription.number,
      generatedAt: new Date().toISOString(),
      locale: "fr-FR",
      paperSize: "A4",
      orientation: "portrait",
    },
    tenant: {
      name: TENANT.name,
      phone: TENANT.phone,
      email: TENANT.email,
      address: TENANT.address,
      district: TENANT.district,
    },
    prescription: {
      id: prescription.id,
      number: prescription.number,
      date: prescription.date,
      dateFormatted: formatDate(prescription.date),
      validityDays: prescription.validityDays,
      validityEnd: validityEnd.toISOString(),
      validityEndFormatted: formatDate(validityEnd.toISOString()),
      status: prescription.status,
      patientName: prescription.patientName,
      doctorName: prescription.doctorName,
      notes: prescription.notes ?? null,
    },
    medications: prescription.medications.map((m, idx) => ({
      index: idx + 1,
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions ?? null,
      line: `${m.name} — ${m.dosage}, ${m.frequency}, pendant ${m.duration}${
        m.instructions ? ` (${m.instructions})` : ""
      }`,
    })),
    legal: {
      law: "Loi 2013-450 du 19 juin 2013 (Côte d'Ivoire)",
      retention: "Conservation 10 ans — article 11",
      confidentiality: "Document médical confidentiel — circulation restreinte",
      authority: "ARTCI — Autorité de Régulation des Télécommunications de Côte d'Ivoire",
    },
    footer: {
      disclaimer: "Ce document est un ordonnance médicale. La délivrance des médicaments relève du pharmacien.",
      contact: `Support OgouMEDICAL — ${TENANT.phone} · ${TENANT.email}`,
    },
  };

  return NextResponse.json({
    success: true,
    message: "Données PDF préparées",
    pdfData,
    rendering: {
      library: "react-pdf (@react-pdf/renderer) — recommandé côté client",
      template: "prescription-pdf",
      cacheKey: `presc_${prescription.id}_${new Date(prescription.date).getTime()}`,
    },
  });
}
