// @ts-nocheck
/**
 * MediSaaS CI — Edge Function : SMS de rappel J-1 (cron horaire)
 * ============================================================
 * Exécutée toutes les heures via Supabase Scheduled Functions.
 * Pour chaque rendez-vous prévu J+1 (entre 24h et 48h), envoie
 * un SMS de rappel au patient via Africa's Talking.
 *
 * Conformité Loi 2013-450 :
 *   - Le patient doit avoir consenti à recevoir des SMS (opt-in).
 *   - Le contenu du SMS ne révèle aucune information médicale
 *     sensible (motif tronqué, pas de diagnostic).
 *   - Chaque envoi est journalisé dans audit_logs.
 *
 * Déclenchement : `supabase functions invoke sms-reminder-cron`
 * ou planifié via le dashboard Supabase (cron "0 * * * *").
 * ============================================================
 */

interface AppointmentRow {
  id: string;
  tenant_id: string;
  patient_id: string;
  date: string;
  reason: string;
  type: string;
  status: string;
  patients: {
    first_name: string;
    last_name: string;
    phone: string | null;
    sms_consent: boolean | null;
  }[];
  users: {
    name: string;
    specialty: string | null;
  }[];
  tenants: {
    name: string;
    code_prefix: string | null;
    phone: string | null;
  }[];
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

/** Envoie un SMS via Africa's Talking. */
async function sendSms(
  apiKey: string,
  username: string,
  sender: string,
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const res = await fetch(
      "https://api.africastalking.com/version1/messaging",
      {
        method: "POST",
        headers: {
          apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({ username, to, message, from: sender }),
      }
    );
    if (!res.ok) return { success: false };
    const data = await res.json();
    return {
      success: data.SMSMessageData?.Message === "Sent to Gateway" ?? false,
      messageId: data.SMSMessageData?.Recipients?.[0]?.messageId,
    };
  } catch (e) {
    console.error("Erreur envoi SMS :", e);
    return { success: false };
  }
}

// --- Handler principal -------------------------------------
Deno.serve(async (req: Request) => {
  // Le cron Supabase envoie un POST ; on autorise aussi GET manuel
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  let supabaseUrl: string;
  let supabaseServiceKey: string;
  let apiKey: string;
  let username: string;
  let sender: string;
  try {
    supabaseUrl = requireEnv("SUPABASE_URL");
    supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    apiKey = requireEnv("AFRICAS_TALKING_API_KEY");
    username = Deno.env.get("AFRICAS_TALKING_USERNAME") ?? "MediSaaS";
    sender = Deno.env.get("AFRICAS_TALKING_SENDER") ?? "MediSaaS";
  } catch (e) {
    console.error("Configuration manquante :", e.message);
    return json({ error: "Configuration serveur incomplète" }, 500);
  }

  const adminHeaders: HeadersInit = {
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
    "Content-Type": "application/json",
  };

  // Calcul de la fenêtre J+1 (24h → 48h)
  const now = new Date();
  const startWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endWindow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Requête : RDV planifiés/confirmés dans la fenêtre, avec patient,
  // médecin et tenant, et consentement SMS du patient.
  const url =
    `${supabaseUrl}/rest/v1/appointments` +
    `?select=id,tenant_id,patient_id,date,reason,type,status,` +
    `patients!inner(first_name,last_name,phone,sms_consent),` +
    `users!inner(name,specialty),` +
    `tenants!inner(name,code_prefix,phone)` +
    `&date=gte.${startWindow.toISOString()}` +
    `&date=lt.${endWindow.toISOString()}` +
    `&status=in.(planifie,confirme)` +
    `&patients.sms_consent=eq.true`;

  const res = await fetch(url, { headers: adminHeaders });
  if (!res.ok) {
    console.error("Échec requête RDV :", await res.text());
    return json({ error: "Requête RDV échouée" }, 500);
  }

  const appointments: AppointmentRow[] = await res.json();
  const results: Array<{ id: string; phone: string; success: boolean }> = [];

  for (const apt of appointments) {
    const patient = apt.patients?.[0];
    if (!patient?.phone) continue;
    if (patient.sms_consent === false) continue;

    const doctor = apt.users?.[0];
    const tenant = apt.tenants?.[0];

    // Formatage date FR (ex. "mardi 16/01 à 14h30")
    const d = new Date(apt.date);
    const dateStr = d.toLocaleString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Message tronqué pour Loi 2013-450 : pas de motif détaillé
    const reasonHint = apt.reason?.length > 30
      ? apt.reason.slice(0, 30) + "…"
      : apt.reason ?? "consultation";

    const message =
      `Rappel ${tenant?.name ?? "MediSaaS"} : RDV ${dateStr} ` +
      `avec ${doctor?.name ?? "votre médecin"} (${reasonHint}). ` +
      `Tél cabinet : ${tenant?.phone ?? ""}. ` +
      `Merci de confirmer votre présence.`;

    const r = await sendSms(apiKey, username, sender, patient.phone, message);
    results.push({
      id: apt.id,
      phone: patient.phone,
      success: r.success,
    });

    // Journalisation (un audit log par SMS)
    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        tenant_id: apt.tenant_id,
        action: r.success ? "sms.reminder.sent" : "sms.reminder.failed",
        entity: "appointment",
        entity_id: apt.id,
        metadata: {
          phone: patient.phone,
          patient_id: apt.patient_id,
          message_id: r.messageId ?? null,
          appointment_date: apt.date,
        },
      }),
    });
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  return json({
    processed: results.length,
    sent,
    failed,
    window: { start: startWindow.toISOString(), end: endWindow.toISOString() },
  });
});
