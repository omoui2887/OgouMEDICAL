import { NextRequest, NextResponse } from "next/server";
import { TENANT } from "@/lib/mock-data";

type Channel = "sms" | "whatsapp" | "email" | "push" | "in_app";
const VALID_CHANNELS: Channel[] = ["sms", "whatsapp", "email", "push", "in_app"];

interface NotificationRequest {
  channels?: Channel[];
  recipient?: { phone?: string; email?: string; userId?: string };
  template?: string;
  subject?: string;
  body?: string;
  data?: Record<string, unknown>;
}

// POST /api/notifications/send — Envoi multi-canal (SMS, WhatsApp, Email, Push, In-app)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NotificationRequest;
    const channels = body.channels ?? ["in_app"];

    if (!Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { success: false, error: "Au moins un canal requis" },
        { status: 400 }
      );
    }
    const invalid = channels.filter((c) => !VALID_CHANNELS.includes(c));
    if (invalid.length > 0) {
      return NextResponse.json(
        { success: false, error: `Canaux invalides : ${invalid.join(", ")}. Valides : ${VALID_CHANNELS.join(", ")}` },
        { status: 400 }
      );
    }
    if (!body.body && !body.template) {
      return NextResponse.json(
        { success: false, error: "Corps (body) ou template requis" },
        { status: 400 }
      );
    }

    // Validation du téléphone pour SMS/WhatsApp
    if (channels.includes("sms") || channels.includes("whatsapp")) {
      const phone = body.recipient?.phone;
      if (!phone) {
        return NextResponse.json(
          { success: false, error: "Téléphone requis pour SMS/WhatsApp" },
          { status: 400 }
        );
      }
      const ivorianRegex = /^(\+225)?(07|05|01|27)\d{8}$/;
      if (!ivorianRegex.test(phone.replace(/\s+/g, ""))) {
        return NextResponse.json(
          { success: false, error: "Numéro ivoirien invalide" },
          { status: 400 }
        );
      }
    }
    if (channels.includes("email") && !body.recipient?.email) {
      return NextResponse.json(
        { success: false, error: "Email requis pour le canal email" },
        { status: 400 }
      );
    }

    // En production : appels réels aux providers
    // - SMS : Africa's Talking (sandbox ou prod)
    // - WhatsApp : Meta WhatsApp Cloud API
    // - Email : Resend / Postmark / SendGrid
    // - Push : Web Push VAPID
    // - In-app : Supabase Realtime ou table notifications
    const results = channels.map((channel) => {
      const messageId = `notif_${channel}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const provider =
        channel === "sms" ? "Africa's Talking"
        : channel === "whatsapp" ? "Meta WhatsApp Cloud API"
        : channel === "email" ? "Resend"
        : channel === "push" ? "Web Push (VAPID)"
        : "Supabase Realtime";

      return {
        channel,
        provider,
        messageId,
        status: "queued" as const,
        queuedAt: new Date().toISOString(),
        cost:
          channel === "sms" ? 28
          : channel === "whatsapp" ? 15
          : channel === "email" ? 1
          : 0,
        costFormatted:
          channel === "sms" ? "28 FCFA"
          : channel === "whatsapp" ? "15 FCFA"
          : channel === "email" ? "1 FCFA"
          : "Gratuit",
        recipient:
          channel === "sms" || channel === "whatsapp"
            ? body.recipient?.phone
            : channel === "email"
              ? body.recipient?.email
              : body.recipient?.userId ?? "session",
      };
    });

    const totalCost = results.reduce((s, r) => s + r.cost, 0);

    return NextResponse.json({
      success: true,
      message: `Notification envoyée sur ${channels.length} canal/canaux`,
      notification: {
        id: `notif_batch_${Date.now()}`,
        template: body.template ?? "custom",
        subject: body.subject ?? null,
        bodyPreview: (body.body ?? "").slice(0, 120) + ((body.body ?? "").length > 120 ? "…" : ""),
        sentAt: new Date().toISOString(),
        tenantId: TENANT.id,
      },
      results,
      summary: {
        totalChannels: channels.length,
        queued: results.length,
        failed: 0,
        totalCost,
        totalCostFormatted:
          new Intl.NumberFormat("fr-FR").format(totalCost) + " FCFA",
      },
      audit: {
        action: "notification.send",
        law: "Loi 2013-450 — consentement patient requis pour SMS/WhatsApp/Email marketing",
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'envoi de la notification" },
      { status: 500 }
    );
  }
}
