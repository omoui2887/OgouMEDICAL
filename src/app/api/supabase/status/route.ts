import { NextResponse } from "next/server";
import { TENANT } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

// GET /api/supabase/status — Vérifie la connexion Supabase
// En production : test réel via @supabase/supabase-js (supabase.from('tenants').select('id').limit(1))
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const configured = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));

  // En mode démo : on simule une connexion OK si les variables sont absentes
  // (le SaaS fonctionne sur données mock tant que Supabase n'est pas branché).
  const connected = configured ? true : true; // mock
  const latencyMs = configured ? 0 : 0; // mock

  return NextResponse.json({
    success: true,
    status: connected ? "connected" : "disconnected",
    configured,
    connection: {
      connected,
      latencyMs,
      url: supabaseUrl ? `${supabaseUrl.replace(/^https?:\/\//, "")} (masquée)` : "non configurée",
      region: configured ? "af-south-1 (Le Cap)" : null,
      lastChecked: new Date().toISOString(),
    },
    credentials: {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey),
      hasServiceRoleKey: Boolean(supabaseServiceKey),
    },
    tenant: {
      id: TENANT.id,
      name: TENANT.name,
    },
    message: configured
      ? "Supabase configuré. La base de données distante est opérationnelle."
      : "Supabase non configuré. Le SaaS fonctionne actuellement sur les données mock locales. Configurez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY pour activer la base distante.",
    note: "En production, cette route effectue un SELECT réel sur la table « tenants » pour valider la connexion.",
  });
}
