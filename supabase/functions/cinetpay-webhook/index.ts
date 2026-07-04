// @ts-nocheck
/**
 * MediSaaS CI — Edge Function : Webhook CinetPay
 * ============================================================
 * Reçoit les webhooks CinetPay (Orange Money, Wave, MTN Money,
 * Carte bancaire) et met à jour le statut de paiement de la
 * facture correspondante. Déclenche ensuite une notification
 * SMS/WhatsApp au patient.
 *
 * Flux :
 *   1. CinetPay envoie un POST avec le payload du paiement.
 *   2. On vérifie la signature HMAC (header X-CinetPay-Signature).
 *   3. On appelle l'API CinetPay /payment/check pour confirmer.
 *   4. On met à jour le statut de la facture et du paiement.
 *   5. On déclenche la notification patient (SMS/WhatsApp).
 *
 * Conformité Loi 2013-450 : journalisation dans audit_logs.
 * ============================================================
 */

// --- Types de payload (simplifiés) -------------------------
interface CinetPayWebhookPayload {
  transaction_id: string;
  status: string;          // "ACCEPTED" | "REFUSED" | "PENDING"
  amount: number;          // en FCFA
  currency?: string;       // "XOF"
  payment_method?: string; // "ORANGE_MONEY" | "WAVE" | "MTN_MONEY" | "CARD"
  customer_phone?: string;
  customer_name?: string;
  metadata?: {
    invoice_id?: string;
    tenant_id?: string;
    patient_id?: string;
  };
}

interface SupabasePaymentRow {
  id: string;
  invoice_id: string;
  tenant_id: string;
  amount: number;
  status: string;
}

// --- Helpers -----------------------------------------------
const CINETPAY_BASE_URL = "https://api-checkout.cinetpay.com/v2";

/** Lit une variable d'environnement obligatoirement. */
function requireEnv(key: string): string {
  const v = Deno.env.get(key);
  if (!v) {
    throw new Error(`Variable d'environnement manquante : ${key}`);
  }
  return v;
}

/** Vérifie la signature HMAC SHA-256 envoyée par CinetPay. */
async function verifySignature(
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

/** Confirme le paiement auprès de CinetPay (anti-fraude). */
async function confirmWithCinetPay(
  transactionId: string,
  apikey: string,
  siteId: string
): Promise<{ ok: boolean; status: string; amount?: number }> {
  try {
    const res = await fetch(`${CINETPAY_BASE_URL}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey,
        site_id: siteId,
        transaction_id: transactionId,
      }),
    });
    if (!res.ok) return { ok: false, status: "REFUSED" };
    const json = await res.json();
    return {
      ok: json.data?.status === "ACCEPTED",
      status: json.data?.status ?? "REFUSED",
      amount: json.data?.amount,
    };
  } catch {
    return { ok: false, status: "ERROR" };
  }
}

/** Envoie un SMS de confirmation via Africa's Talking. */
async function sendSmsConfirmation(
  phone: string,
  amount: number,
  invoiceNumber: string
): Promise<void> {
  const apiKey = Deno.env.get("AFRICAS_TALKING_API_KEY");
  const sender = Deno.env.get("AFRICAS_TALKING_SENDER") ?? "MediSaaS";
  if (!apiKey) return;
  const message =
    `MediSaaS CI : Paiement de ${amount.toLocaleString("fr-FR")} FCFA ` +
    `confirmé pour la facture ${invoiceNumber}. Merci.`;
  try {
    await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        username: Deno.env.get("AFRICAS_TALKING_USERNAME") ?? "sandbox",
        to: phone,
        message,
        from: sender,
      }),
    });
  } catch (e) {
    console.error("SMS confirmation échoué :", e);
  }
}

// --- Handler principal -------------------------------------
Deno.serve(async (req: Request) => {
  // CORS / méthodes
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-CinetPay-Signature",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  // Variables d'environnement
  let supabaseUrl: string;
  let supabaseServiceKey: string;
  let cinetpayApikey: string;
  let cinetpaySiteId: string;
  let cinetpaySecret: string;
  try {
    supabaseUrl = requireEnv("SUPABASE_URL");
    supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    cinetpayApikey = requireEnv("CINETPAY_API_KEY");
    cinetpaySiteId = requireEnv("CINETPAY_SITE_ID");
    cinetpaySecret = requireEnv("CINETPAY_WEBHOOK_SECRET");
  } catch (e) {
    console.error("Configuration manquante :", e.message);
    return json({ error: "Configuration serveur incomplète" }, 500);
  }

  // Lecture et vérification du payload
  const rawBody = await req.text();
  const signature = req.headers.get("X-CinetPay-Signature");

  if (!await verifySignature(rawBody, signature, cinetpaySecret)) {
    console.warn("Signature invalide reçue");
    return json({ error: "Signature invalide" }, 401);
  }

  let payload: CinetPayWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Payload JSON invalide" }, 400);
  }

  // Validation des champs requis
  if (!payload.transaction_id || !payload.status) {
    return json({ error: "Champs requis manquants" }, 400);
  }

  const invoiceId = payload.metadata?.invoice_id;
  const tenantId = payload.metadata?.tenant_id;
  if (!invoiceId || !tenantId) {
    return json({ error: "Métadonnées invoice_id/tenant_id manquantes" }, 400);
  }

  // Confirmation anti-fraude auprès de CinetPay
  const confirmation = await confirmWithCinetPay(
    payload.transaction_id,
    cinetpayApikey,
    cinetpaySiteId
  );

  const finalStatus =
    confirmation.ok && payload.status === "ACCEPTED"
      ? "reussi"
      : payload.status === "REFUSED"
      ? "echoue"
      : "en_attente";

  // Mise à jour du paiement et de la facture via Supabase Admin
  const adminHeaders: HeadersInit = {
    apikey: supabaseServiceKey,
    Authorization: `Bearer ${supabaseServiceKey}`,
    "Content-Type": "application/json",
  };

  // 1. Mettre à jour le paiement
  const paymentUpdateRes = await fetch(
    `${supabaseUrl}/rest/v1/payments?provider=eq.${payload.transaction_id}`,
    {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        status: finalStatus,
        phone: payload.customer_phone,
        payer_name: payload.customer_name,
        method: mapMethod(payload.payment_method),
      }),
    }
  );
  if (!paymentUpdateRes.ok) {
    console.error("Échec mise à jour paiement :", await paymentUpdateRes.text());
    return json({ error: "Mise à jour paiement échouée" }, 500);
  }

  // 2. Si paiement réussi, marquer la facture comme payée
  if (finalStatus === "reussi") {
    const invoiceRes = await fetch(
      `${supabaseUrl}/rest/v1/invoices?id=eq.${invoiceId}&select=id,total,status`,
      { headers: adminHeaders }
    );
    const invoices = await invoiceRes.json();
    const invoice = invoices?.[0];
    if (invoice) {
      const newStatus = invoice.status === "partielle" ? "payee" : "payee";
      await fetch(`${supabaseUrl}/rest/v1/invoices?id=eq.${invoiceId}`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ status: newStatus }),
      });

      // 3. Notification SMS patient
      if (payload.customer_phone) {
        await sendSmsConfirmation(
          payload.customer_phone,
          payload.amount,
          invoice.id
        );
      }

      // 4. Journalisation d'audit (Loi 2013-450)
      await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          tenant_id: tenantId,
          action: "payment.success",
          entity: "invoice",
          entity_id: invoiceId,
          metadata: {
            transaction_id: payload.transaction_id,
            amount: payload.amount,
            method: payload.payment_method,
          },
        }),
      });
    }
  }

  // CinetPay attend un 200 pour acquitter le webhook
  return json({ received: true, status: finalStatus }, 200);
});

// --- Utilitaires -------------------------------------------
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mapMethod(method?: string): string {
  switch ((method ?? "").toUpperCase()) {
    case "ORANGE_MONEY":
      return "orange_money";
    case "WAVE":
      return "wave";
    case "MTN_MONEY":
      return "mtn_money";
    case "CARD":
      return "card";
    default:
      return "cash";
  }
}
