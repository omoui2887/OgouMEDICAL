// @ts-nocheck
/**
 * MediSaaS CI — Edge Function : cron de rappels SMS (24h) et WhatsApp (1h)
 * ====================================================================
 * Déployée sur Supabase Edge Functions.
 * Planifiée via Supabase Dashboard > Functions > Schedule (toutes les heures).
 *
 * Flux :
 *   1. Récupère les RDV éligibles (J+1 dans l'heure courante, rappel non envoyé)
 *   2. Pour chaque RDV : envoie SMS via Africa's Talking
 *   3. Marque reminder_sent_24h = true
 *   4. Audite l'envoi (conformité Loi 2013-450)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const atApiKey = Deno.env.get("AFRICASTALKING_API_KEY")!;
const atUsername = Deno.env.get("AFRICASTALKING_USERNAME") ?? "medisaas_ci";
const atSenderId = Deno.env.get("AFRICASTALKING_SENDER_ID") ?? "MEDISAAS";
const atSandbox = Deno.env.get("AFRICASTALKING_SANDBOX") === "true";

const supabase = createClient(supabaseUrl, supabaseKey);
const AT_BASE_URL = atSandbox
  ? "https://apis.sandbox.africastalking.com/version1"
  : "https://apis.africastalking.com/version1";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "24h";
  console.log(`🕐 Cron rappels ${type} démarré à ${new Date().toISOString()}`);

  try {
    if (type === "24h") await send24hSmsReminders();
    else if (type === "1h") await send1hWhatsAppReminders();
    else if (type === "missed") await markMissedAppointments();

    return new Response(JSON.stringify({ success: true, type, timestamp: new Date().toISOString() }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erreur cron rappels :", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function send24hSmsReminders() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id, start_time, appointment_date, tenant_id,
      patient:patients(first_name, last_name, phone, sms_consent),
      doctor:doctors(id, user:users(first_name, last_name)),
      tenant:tenants(name)
    `)
    .eq("appointment_date", tomorrow.toISOString().slice(0, 10))
    .eq("reminder_sent_24h", false)
    .in("status", ["planifie", "confirme"]);

  if (error) throw error;
  if (!appointments || appointments.length === 0) {
    console.log("Aucun rappel 24h à envoyer.");
    return;
  }

  let sent = 0;
  let failed = 0;
  for (const apt of appointments) {
    if (!apt.patient?.sms_consent) continue;
    const message = `Bonjour ${apt.patient.first_name}, rappel de votre RDV le ${formatDateFr(apt.appointment_date)} à ${apt.start_time.slice(0, 5)} avec Dr. ${apt.doctor?.user?.last_name} au cabinet ${apt.tenant?.name}. Pour annuler, répondez NON.`;
    try {
      await sendSmsViaAfricasTalking(apt.patient.phone, message);
      await supabase.from("appointments").update({ reminder_sent_24h: true }).eq("id", apt.id);
      await supabase.from("audit_logs").insert({
        tenant_id: apt.tenant_id,
        action: "SMS_REMINDER_24H_SENT",
        resource_type: "appointment",
        resource_id: apt.id,
        metadata: { phone: apt.patient.phone, message_length: message.length },
      });
      sent++;
    } catch (err) {
      console.error(`Échec SMS pour RDV ${apt.id}:`, err.message);
      failed++;
    }
  }
  console.log(`✅ Rappels 24h : ${sent} envoyés, ${failed} échecs`);
}

async function send1hWhatsAppReminders() {
  const now = new Date();
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id, start_time, appointment_date, tenant_id,
      patient:patients(first_name, phone, whatsapp_consent),
      doctor:doctors(user:users(first_name, last_name)),
      tenant:tenants(name, address)
    `)
    .eq("appointment_date", now.toISOString().slice(0, 10))
    .eq("reminder_sent_1h", false)
    .in("status", ["planifie", "confirme"]);

  if (error) throw error;
  if (!appointments) return;

  for (const apt of appointments) {
    if (!apt.patient?.whatsapp_consent) continue;
    try {
      await sendWhatsAppTemplate(apt.patient.phone, "rdv_reminder_1h", {
        patient_name: apt.patient.first_name,
        doctor_name: `Dr. ${apt.doctor?.user?.last_name}`,
        time: apt.start_time.slice(0, 5),
        cabinet: apt.tenant?.name,
      });
      await supabase.from("appointments").update({ reminder_sent_1h: true }).eq("id", apt.id);
      await supabase.from("audit_logs").insert({
        tenant_id: apt.tenant_id,
        action: "WHATSAPP_REMINDER_1H_SENT",
        resource_type: "appointment",
        resource_id: apt.id,
      });
    } catch (err) {
      console.error(`Échec WhatsApp pour RDV ${apt.id}:`, err.message);
    }
  }
}

async function markMissedAppointments() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "absent" })
    .lt("appointment_date", today)
    .in("status", ["planifie", "confirme"])
    .select("id, tenant_id, patient_id");
  if (error) throw error;
  console.log(`📝 ${data?.length ?? 0} RDV marqués comme absents`);
}

async function sendSmsViaAfricasTalking(to: string, message: string): Promise<void> {
  const payload = new URLSearchParams({
    username: atUsername,
    to: to.replace(/\s/g, ""),
    message,
    from: atSenderId,
  });
  const res = await fetch(`${AT_BASE_URL}/messaging`, {
    method: "POST",
    headers: {
      apiKey: atApiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: payload.toString(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const recipient = data?.SMSMessageData?.Recipients?.[0];
  if (!recipient || recipient.status !== "Success") {
    throw new Error(`Statut SMS: ${recipient?.status ?? "Unknown"}`);
  }
}

async function sendWhatsAppTemplate(to: string, template: string, params: Record<string, string>): Promise<void> {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "template",
      template: {
        name: template,
        language: { code: "fr" },
        components: [
          { type: "body", parameters: Object.values(params).map((v) => ({ type: "text", text: v })) },
        ],
      },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp HTTP ${res.status}`);
}

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
