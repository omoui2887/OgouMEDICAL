// @ts-nocheck
/**
 * MediSaaS CI — Edge Function : Webhook Daily.co
 * ============================================================
 * Reçoit les webhooks Daily.co (début / fin de téléconsultation)
 * et met à jour le rendez-vous correspondant :
 *   - Enregistre la durée effective de la session.
 *   - Marque le rendez-vous comme "termine" à la fin.
 *   - Journalise l'événement dans audit_logs (Loi 2013-450).
 *
 * Événements gérés :
 *   - "meeting.started"  → statut RDV = "en_cours"
 *   - "meeting.ended"    → statut RDV = "termine" + durée calculée
 *
 * Sécurité :
 *   - Vérification de la signature HMAC Daily.co.
 *   - Les recordings sont DÉSACTIVÉS par défaut (conformité Loi
 *     2013-450 sur les données de santé).
 * ============================================================
 */

interface DailyWebhookPayload {
  event: string;           // "meeting.started" | "meeting.ended"
  room: {
    name: string;          // ID du room Daily.co
    id?: string;
  };
  timestamp: string;       // ISO 8601
  payload?: {
    start_ts?: number;     // unix seconds
    duration?: number;     // seconds
    participants?: number;
  };
  meeting_id?: string;     // mapping avec appointments.id
  tenant_id?: string;
}

/** Variable d'environnement obligatoire. */
function requireEnv(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Variable d'environnement manquante : ${key}`);
  return v;
}

/** Vérifie la signature HMAC SHA-256 Daily.co. */
async function verifyDailySignature(
  rawBody: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );
  const expectedHex = Array.from(new Uint8Array(expected))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expectedHex === signature;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// --- Handler principal -------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Daily-Signature",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  // Configuration
  let supabaseUrl: string;
  let supabaseServiceKey: string;
  let dailyWebhookSecret: string;
  try {
    supabaseUrl = requireEnv("SUPABASE_URL");
    supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    dailyWebhookSecret = requireEnv("DAILY_WEBHOOK_SECRET");
  } catch (e) {
    console.error("Configuration manquante :", e.message);
    return json({ error: "Configuration serveur incomplète" }, 500);
  }

  // Vérification de signature
  const rawBody = await req.text();
  const signature = req.headers.get("X-Daily-Signature");
  if (!await verifyDailySignature(rawBody, signature, dailyWebhookSecret)) {
    console.warn("Signature Daily.co invalide");
    return json({ error: "Signature invalide" }, 401);
  }

  // Parsing
  let payload: DailyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Payload JSON invalide" }, 400);
  }

  if (!payload.event || !payload.room?.name) {
    return json({ error: "Champs event/room.name requis" }, 400);
  }

  // Le room name contient l'ID du rendez-vous (room_url formaté)
  const appointmentId = payload.meeting_id || payload.room.name;
  const tenantId = payload.tenant_id;
  if (!appointmentId) {
    return json({ error: "meeting_id manquant" }, 400);
  }

  const adminHeaders: HeadersInit = {
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
    "Content-Type": "application/json",
  };

  // Traitement selon l'événement
  if (payload.event === "meeting.started") {
    // Marquer le RDV comme "en_cours"
    const res = await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ status: "en_cours" }),
      }
    );
    if (!res.ok) {
      console.error("Échec mise à jour RDV (start) :", await res.text());
      return json({ error: "Mise à jour RDV échouée" }, 500);
    }

    // Audit log
    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        tenant_id: tenantId,
        action: "teleconsultation.start",
        entity: "appointment",
        entity_id: appointmentId,
        metadata: {
          room: payload.room.name,
          timestamp: payload.timestamp,
          participants: payload.payload?.participants ?? 0,
        },
      }),
    });

    return json({ received: true, status: "en_cours" });
  }

  if (payload.event === "meeting.ended") {
    const durationSec = payload.payload?.duration ?? 0;
    const durationMin = Math.round(durationSec / 60);

    // Marquer le RDV comme "termine" et stocker la durée
    const res = await fetch(
      `${supabaseUrl}/rest/v1/appointments?id=eq.${appointmentId}`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({
          status: "termine",
          duration: durationMin || 30, // défaut 30 min si info manquante
        }),
      }
    );
    if (!res.ok) {
      console.error("Échec mise à jour RDV (end) :", await res.text());
      return json({ error: "Mise à jour RDV échouée" }, 500);
    }

    // Audit log
    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        tenant_id: tenantId,
        action: "teleconsultation.end",
        entity: "appointment",
        entity_id: appointmentId,
        metadata: {
          room: payload.room.name,
          duration_min: durationMin,
          participants: payload.payload?.participants ?? 0,
          // RAPPEL : recordings désactivés par défaut (Loi 2013-450)
          recording: false,
        },
      }),
    });

    return json({
      received: true,
      status: "termine",
      duration_min: durationMin,
    });
  }

  // Événement non géré (ex. "participant.joined") : on acquitte
  return json({ received: true, ignored: payload.event });
});
