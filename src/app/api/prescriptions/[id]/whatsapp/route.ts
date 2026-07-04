import { NextRequest, NextResponse } from "next/server";
import { PRESCRIPTIONS, TENANT } from "@/lib/mock-data";

// POST /api/prescriptions/[id]/whatsapp — Envoie l'ordonnance par WhatsApp
// Body: { phone: "+225 07 08 12 34 56" (optionnel si le patient est lié), message?: string }
// En production : Meta WhatsApp Business Cloud API (https://graph.facebook.com/v18.0/...)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const phone = (body?.phone ?? "").trim() as string;
    const customMessage = body?.message as string | undefined;

    const prescription = PRESCRIPTIONS.find((p) => p.id === id);
    if (!prescription) {
      return NextResponse.json(
        { success: false, error: "Ordonnance introuvable" },
        { status: 404 }
      );
    }
    if (prescription.status === "annulee") {
      return NextResponse.json(
        { success: false, error: "Ordonnance annulée — envoi WhatsApp bloqué" },
        { status: 422 }
      );
    }

    // Validation du numéro ivoirien
    const ivorianPhoneRegex = /^(\+225)?(07|05|01|27)\d{8}$/;
    const normalizedPhone = phone.replace(/\s+/g, "");
    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, error: "Numéro WhatsApp requis" },
        { status: 400 }
      );
    }
    if (!ivorianPhoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Numéro ivoirien invalide. Format attendu : +225 07/05/01/27 XX XX XX XX",
        },
        { status: 400 }
      );
    }

    const message =
      customMessage ??
      `Bonjour ${prescription.patientName}, votre ordonnance n°${prescription.number} du ${new Date(prescription.date).toLocaleDateString("fr-FR")} établie par ${prescription.doctorName} est disponible. Consultez-la dans votre espace patient OgouMEDICAL. — ${TENANT.name}`;

    // En production : POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
    // avec template "ordonnance_notification" + bearer token Meta.
    const messageId = `wamid.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;

    return NextResponse.json({
      success: true,
      message: "Ordonnance envoyée par WhatsApp",
      whatsapp: {
        messageId,
        to: normalizedPhone,
        from: TENANT.phone.replace(/\s+/g, ""),
        template: "ordonnance_notification",
        bodyPreview: message.slice(0, 100) + (message.length > 100 ? "…" : ""),
        status: "queued",
        provider: "Meta WhatsApp Business Cloud API",
        sentAt: new Date().toISOString(),
        estimatedDelivery: "30 secondes",
      },
      prescription: {
        id: prescription.id,
        number: prescription.number,
        patientName: prescription.patientName,
      },
      audit: {
        action: "prescription.whatsapp.send",
        law: "Loi 2013-450 — consentement patient requis (opt-in)",
        tenantId: TENANT.id,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'envoi WhatsApp" },
      { status: 500 }
    );
  }
}
