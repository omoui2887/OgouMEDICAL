// @ts-nocheck
/**
 * MediSaaS CI — Edge Function : Rappel WhatsApp Business
 * ============================================================
 * Envoie un rappel de rendez-vous via WhatsApp Business Cloud API
 * (Meta Graph API). À appeler depuis le cron SMS ou manuellement
 * après création / confirmation d'un RDV.
 *
 * Conformité Loi 2013-450 :
 *   - Consentement explicite du patient requis (opt-in).
 *   - Pas d'information médicale sensible dans le message.
 *   - Journalisation dans audit_logs.
 *
 * Limites WhatsApp :
 *   - Fenêtre de service 24h après la dernière interaction patient.
 *   - Hors fenêtre, seuls les templates approuvés sont autorisés.
 *   - Numéro au format international sans "+" (ex. 2250708123456).
 * ============================================================
 */

interface WhatsAppReminderRequest {
  appointment_id: string;
  tenant_id: string;
  patient_phone: string;     // format international sans "+"
  patient_name: string;
  doctor_name: string;
  appointment_date: string;  // ISO 8601
  reason?: string;
  cabinet_name: string;
  cabinet_phone?: string;
}

interface WhatsAppTemplate {
  name: string;
  language: { code: string };
  components: Array<{
    type: string;
    parameters: Array<{ type: string; text: string }>;
  }>;
}

function requireEnv(key: string): string {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Variable d'environnement manquante : ${key}`);
  return v;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Récupère un token d'accès Meta valide. */
function getAccessToken(): string {
  // En production : token long durée (60 jours) stocké en secret.
  // Rotation via refresh token OAuth.
  return requireEnv("WHATSAPP_ACCESS_TOKEN");
}

/** Numéro de téléphone de l'expéditeur (Phone Number ID Meta). */
function getPhoneNumberId(): string {
  return requireEnv("WHATSAPP_PHONE_NUMBER_ID");
}

/** Envoie un message template WhatsApp. */
async function sendWhatsAppTemplate(
  payload: WhatsAppReminderRequest
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = getAccessToken();
  const phoneId = getPhoneNumberId();
  const apiVersion = Deno.env.get("WHATSAPP_API_VERSION") ?? "v18.0";

  // Formatage de la date en français
  const d = new Date(payload.appointment_date);
  const dateStr = d.toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Template approuvé par Meta (à configurer côté Business Manager)
  // Le template "rdv_rappel" doit contenir 4 variables :
  // {{1}} = nom patient, {{2}} = date, {{3}} = médecin, {{4}} = cabinet
  const template: WhatsAppTemplate = {
    name: Deno.env.get("WHATSAPP_TEMPLATE_RDV") ?? "rdv_rappel",
    language: { code: "fr" },
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: payload.patient_name },
          { type: "text", text: dateStr },
          { type: "text", text: payload.doctor_name },
          { type: "text", text: payload.cabinet_name },
        ],
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: payload.patient_phone,
          type: "template",
          template,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Erreur WhatsApp API :", err);
      return { success: false, error: err };
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (e) {
    console.error("Exception envoi WhatsApp :", e);
    return { success: false, error: String(e) };
  }
}

// --- Handler principal -------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  // Configuration
  let supabaseUrl: string;
  let supabaseServiceKey: string;
  try {
    supabaseUrl = requireEnv("SUPABASE_URL");
    supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (e) {
    console.error("Configuration manquante :", e.message);
    return json({ error: "Configuration serveur incomplète" }, 500);
  }

  // Authentification : seul le service_role ou un token interne
  // peut appeler cette fonction (pas d'appel direct patient).
  const authHeader = req.headers.get("Authorization");
  const internalSecret = Deno.env.get("INTERNAL_API_SECRET");
  if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
    return json({ error: "Non autorisé" }, 401);
  }

  // Parsing et validation
  let body: WhatsAppReminderRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body JSON invalide" }, 400);
  }

  const required: Array<keyof WhatsAppReminderRequest> = [
    "appointment_id",
    "tenant_id",
    "patient_phone",
    "patient_name",
    "doctor_name",
    "appointment_date",
    "cabinet_name",
  ];
  for (const k of required) {
    if (!body[k]) {
      return json({ error: `Champ requis manquant : ${k}` }, 400);
    }
  }

  // Validation du numéro (format international, 8 à 15 chiffres)
  const phoneClean = body.patient_phone.replace(/[^\d]/g, "");
  if (phoneClean.length < 8 || phoneClean.length > 15) {
    return json({ error: "Numéro WhatsApp invalide" }, 400);
  }
  body.patient_phone = phoneClean;

  // Envoi du message template
  const result = await sendWhatsAppTemplate(body);

  // Journalisation (Loi 2013-450)
  const adminHeaders: HeadersInit = {
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
    "Content-Type": "application/json",
  };
  await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      tenant_id: body.tenant_id,
      action: result.success
        ? "whatsapp.reminder.sent"
        : "whatsapp.reminder.failed",
      entity: "appointment",
      entity_id: body.appointment_id,
      metadata: {
        phone: phoneClean,
        patient_name: body.patient_name,
        message_id: result.messageId ?? null,
        error: result.error ?? null,
      },
    }),
  });

  if (!result.success) {
    return json(
      { error: "Échec envoi WhatsApp", detail: result.error },
      502
    );
  }

  return json({
    success: true,
    message_id: result.messageId,
    recipient: phoneClean,
  });
});
