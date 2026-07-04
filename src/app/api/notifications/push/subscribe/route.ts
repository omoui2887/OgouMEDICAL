import { NextRequest, NextResponse } from "next/server";

interface PushSubscriptionBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId?: string;
  patientId?: string;
  deviceInfo?: { userAgent?: string; platform?: string };
}

// Mock : registre partagé en mémoire (en prod : table push_subscriptions Supabase)
const SUBSCRIPTIONS_STORE = new Map<
  string,
  PushSubscriptionBody & { id: string; createdAt: string }
>();

// POST /api/notifications/push/subscribe — Enregistre un abonnement push
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PushSubscriptionBody;

    if (!body.endpoint || typeof body.endpoint !== "string") {
      return NextResponse.json(
        { success: false, error: "endpoint requis" },
        { status: 400 }
      );
    }
    if (!body.keys || !body.keys.p256dh || !body.keys.auth) {
      return NextResponse.json(
        { success: false, error: "keys.p256dh et keys.auth requis" },
        { status: 400 }
      );
    }

    const id = `pushsub_${Buffer.from(body.endpoint).toString("base64url").slice(0, 24)}`;
    const record = {
      ...body,
      id,
      createdAt: new Date().toISOString(),
    };

    SUBSCRIPTIONS_STORE.set(id, record);

    // En production : INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)
    // puis envoi d'une notification de bienvenue via web-push.sendNotification()

    return NextResponse.json({
      success: true,
      message: "Abonnement push enregistré",
      subscription: {
        id,
        endpoint: body.endpoint,
        userId: body.userId ?? body.patientId ?? "anonymous",
        createdAt: record.createdAt,
      },
      welcomeNotification: {
        title: "OgouMEDICAL — Notifications activées",
        body: "Vous recevrez désormais les rappels de rendez-vous et alertes importantes.",
        icon: "/icon-192.png",
        badge: "/badge-72.png",
        tag: "welcome",
        requireInteraction: false,
      },
      stats: {
        totalSubscriptionsForUser: countForUser(body.userId ?? body.patientId),
      },
      audit: {
        action: "push.subscribe",
        law: "Loi 2013-450 — consentement explicite pour notifications",
        timestamp: record.createdAt,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement de l'abonnement" },
      { status: 500 }
    );
  }
}

function countForUser(userId?: string): number {
  if (!userId) return 0;
  let count = 0;
  for (const sub of SUBSCRIPTIONS_STORE.values()) {
    if (sub.userId === userId || sub.patientId === userId) count++;
  }
  return count;
}
