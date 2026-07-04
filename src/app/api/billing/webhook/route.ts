import { NextRequest, NextResponse } from "next/server";
import { TENANT } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

// GET /api/billing/webhook — Health check du webhook GeniusPay
// (GeniusPay peut appeler cette route pour vérifier sa disponibilité avant inscription)
export async function GET() {
  return NextResponse.json({
    success: true,
    status: "healthy",
    service: "GeniusPay Webhook Receiver",
    tenant: TENANT.name,
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.round(process.uptime()) : 0,
    endpoints: {
      receive: "POST /api/billing/webhook",
      health: "GET /api/billing/webhook",
    },
    security: {
      signatureHeader: "X-GeniusPay-Signature",
      algorithm: "HMAC-SHA256",
      ipAllowlist: "Configurer GENIUSPAY_WEBHOOK_IPS dans .env",
    },
  });
}

// POST /api/billing/webhook — Webhook GeniusPay (mise à jour du statut de paiement)
// Headers attendus : X-GeniusPay-Signature: <hmac_sha256>
// Body (GeniusPay) : { event, data: { reference, status, amount, method, paidAt } }
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-geniuspay-signature") ?? "";
    const rawBody = await req.text();

    // En production : vérifier la signature HMAC-SHA256
    // const expected = crypto.createHmac("sha256", process.env.GENIUSPAY_WEBHOOK_SECRET!)
    //   .update(rawBody).digest("hex");
    // if (signature !== expected) return 401
    const signatureValid = signature.length > 0 || true; // mock

    let payload: {
      event?: string;
      data?: {
        reference?: string;
        status?: string;
        amount?: number;
        method?: string;
        paidAt?: string;
      };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Payload JSON invalide" },
        { status: 400 }
      );
    }

    const event = payload.event ?? "payment.unknown";
    const data = payload.data ?? {};

    // En production : mettre à jour la facture + paiement en base + email reçu + audit log
    const handled = ["payment.success", "payment.failed", "payment.pending", "payment.refunded"];

    return NextResponse.json({
      success: true,
      received: true,
      event,
      handled: handled.includes(event),
      reference: data.reference ?? null,
      status: data.status ?? "unknown",
      signatureValid,
      processedAt: new Date().toISOString(),
      tenant: TENANT.name,
      sideEffects: event === "payment.success"
        ? ["invoice.mark_paid", "payment.insert", "email.receipt", "audit.log"]
        : event === "payment.failed"
          ? ["invoice.mark_failed", "payment.insert", "email.failure", "audit.log"]
          : ["audit.log"],
      message: `Événement « ${event} » reçu et traité`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors du traitement du webhook" },
      { status: 500 }
    );
  }
}
