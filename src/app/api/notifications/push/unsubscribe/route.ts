import { NextRequest, NextResponse } from "next/server";

interface UnsubscribeBody {
  endpoint?: string;
  id?: string;
  userId?: string;
  patientId?: string;
}

// Mock : registre partagé (doit matcher avec subscribe/route.ts)
const SUBSCRIPTIONS_STORE = new Map<
  string,
  { id: string; endpoint: string; userId?: string; patientId?: string; createdAt: string }
>();

// POST /api/notifications/push/unsubscribe — Supprime un abonnement push
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UnsubscribeBody;

    if (!body.endpoint && !body.id) {
      return NextResponse.json(
        { success: false, error: "endpoint ou id requis" },
        { status: 400 }
      );
    }

    // Recherche de l'abonnement
    let targetId: string | undefined = body.id;
    if (!targetId && body.endpoint) {
      targetId = `pushsub_${Buffer.from(body.endpoint).toString("base64url").slice(0, 24)}`;
    }

    // Si on a un userId mais pas d'endpoint/id précis → on désabonne tous ses appareils
    if (!targetId && (body.userId || body.patientId)) {
      const removed: string[] = [];
      for (const [subId, sub] of SUBSCRIPTIONS_STORE.entries()) {
        if (sub.userId === body.userId || sub.patientId === body.patientId) {
          SUBSCRIPTIONS_STORE.delete(subId);
          removed.push(subId);
        }
      }
      return NextResponse.json({
        success: true,
        message: `${removed.length} abonnement(s) supprimé(s)`,
        removed,
        audit: {
          action: "push.unsubscribe.all",
          law: "Loi 2013-450 — droit de retrait du consentement",
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "Impossible de résoudre l'abonnement à supprimer" },
        { status: 400 }
      );
    }

    const existed = SUBSCRIPTIONS_STORE.has(targetId);
    SUBSCRIPTIONS_STORE.delete(targetId);

    if (!existed) {
      return NextResponse.json({
        success: true,
        message: "Aucun abonnement correspondant (déjà supprimé)",
        id: targetId,
        audit: {
          action: "push.unsubscribe.idempotent",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Abonnement push supprimé",
      id: targetId,
      audit: {
        action: "push.unsubscribe",
        law: "Loi 2013-450 — droit de retrait du consentement",
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression de l'abonnement" },
      { status: 500 }
    );
  }
}
