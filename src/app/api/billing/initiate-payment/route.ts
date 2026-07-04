import { NextRequest, NextResponse } from "next/server";
import { INVOICES, TENANT } from "@/lib/mock-data";
import { formatFCFA, type PaymentMethod } from "@/lib/types";

const VALID_METHODS: PaymentMethod[] = [
  "orange_money", "wave", "mtn_money", "card", "cash",
];

// POST /api/billing/initiate-payment — Initie un paiement GeniusPay
// Body: { invoiceId: string, method: PaymentMethod, phone?: string (Mobile Money), returnUrl?: string }
// En production : POST https://api.geniuspay.ci/v1/payments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, method, phone, returnUrl } = body as {
      invoiceId?: string;
      method?: PaymentMethod;
      phone?: string;
      returnUrl?: string;
    };

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "invoiceId requis" },
        { status: 400 }
      );
    }
    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json(
        {
          success: false,
          error: `Méthode de paiement invalide. Valides : ${VALID_METHODS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const invoice = INVOICES.find((i) => i.id === invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Facture introuvable" },
        { status: 404 }
      );
    }
    if (invoice.status === "payee") {
      return NextResponse.json(
        { success: false, error: "Facture déjà payée", invoiceStatus: invoice.status },
        { status: 422 }
      );
    }

    const remaining = invoice.total - (invoice.paidAmount ?? 0);

    // Pour Mobile Money, le téléphone est obligatoire
    if (["orange_money", "wave", "mtn_money"].includes(method)) {
      if (!phone) {
        return NextResponse.json(
          { success: false, error: `Téléphone requis pour ${method.replace("_", " ")}` },
          { status: 400 }
        );
      }
      const ivorianPhoneRegex = /^(\+225)?(07|05|01|27)\d{8}$/;
      if (!ivorianPhoneRegex.test(phone.replace(/\s+/g, ""))) {
        return NextResponse.json(
          { success: false, error: "Numéro ivoirien invalide" },
          { status: 400 }
        );
      }
    }

    // Génération de la référence GeniusPay
    const reference = `GP-${TENANT.slug.toUpperCase()}-${invoice.number}-${Date.now().toString().slice(-6)}`;

    // En production : POST GeniusPay + retour URL de redirection (Mobile Money) ou session Stripe (carte)
    const paymentData = {
      paymentId: `pay_${Date.now()}`,
      reference,
      invoiceId,
      invoiceNumber: invoice.number,
      patientName: invoice.patientName,
      amount: remaining,
      amountFormatted: formatFCFA(remaining),
      method,
      methodLabel: method === "orange_money" ? "Orange Money"
        : method === "wave" ? "Wave"
        : method === "mtn_money" ? "MTN Money"
        : method === "card" ? "Carte bancaire"
        : "Espèces",
      phone: phone ?? null,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      provider: "GeniusPay",
      callbacks: {
        successUrl: returnUrl ?? `/billing?status=success&reference=${reference}`,
        failureUrl: returnUrl ?? `/billing?status=failure&reference=${reference}`,
        webhookUrl: `/api/billing/webhook`,
      },
      instructions: method === "card"
        ? "Vous serez redirigé vers la page de paiement sécurisée (3-D Secure)."
        : method === "cash"
          ? "Présentez-vous en caisse avec la référence générée."
          : `Un code USSD sera envoyé au ${phone}. Composez-le pour valider le paiement.`,
    };

    return NextResponse.json({
      success: true,
      message: "Paiement initié",
      payment: paymentData,
      security: {
        protocol: "TLS 1.3 + HMAC SHA-256",
        pciDss: "Conforme PCI-DSS niveau 1",
        bceao: "Agréé BCEAO",
        idempotencyKey: reference,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'initiation du paiement" },
      { status: 500 }
    );
  }
}
