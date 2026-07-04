import { NextResponse } from "next/server";
import { TENANT } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

// 12 services critiques surveillés par OgouMEDICAL
const SERVICES = [
  { id: "api", name: "API REST (Next.js)", category: "Backend", status: "operational", uptime: 99.98, latencyMs: 42 },
  { id: "web", name: "Application Web", category: "Frontend", status: "operational", uptime: 99.95, latencyMs: 120 },
  { id: "db", name: "Base de données (Supabase)", category: "Données", status: "operational", uptime: 99.99, latencyMs: 18 },
  { id: "auth", name: "Authentification", category: "Sécurité", status: "operational", uptime: 100.0, latencyMs: 35 },
  { id: "storage", name: "Stockage fichiers", category: "Données", status: "operational", uptime: 99.97, latencyMs: 64 },
  { id: "mobile-money", name: "Mobile Money (GeniusPay)", category: "Paiement", status: "operational", uptime: 99.85, latencyMs: 280 },
  { id: "sms", name: "SMS (Africa's Talking)", category: "Notification", status: "operational", uptime: 99.90, latencyMs: 1500 },
  { id: "whatsapp", name: "WhatsApp Business API", category: "Notification", status: "operational", uptime: 99.88, latencyMs: 1100 },
  { id: "teleconsult", name: "Téléconsultation (Daily.co)", category: "Vidéo", status: "operational", uptime: 99.92, latencyMs: 95 },
  { id: "push", name: "Notifications Push (VAPID)", category: "Notification", status: "operational", uptime: 99.96, latencyMs: 75 },
  { id: "email", name: "Email transactionnel", category: "Notification", status: "operational", uptime: 99.94, latencyMs: 850 },
  { id: "icd10", name: "Recherche CIM-10", category: "Médical", status: "operational", uptime: 100.0, latencyMs: 12 },
] as const;

// GET /api/status — État des services + incidents + contact support
export async function GET() {
  const operational = SERVICES.filter((s) => s.status === "operational").length;
  const degraded = SERVICES.filter((s) => s.status === "degraded").length;
  const down = SERVICES.filter((s) => s.status === "down").length;
  const overallUptime = SERVICES.reduce((sum, s) => sum + s.uptime, 0) / SERVICES.length;

  const overallStatus =
    down > 0 ? "degraded" : degraded > 0 ? "degraded" : "operational";

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    overallStatus,
    summary: {
      total: SERVICES.length,
      operational,
      degraded,
      down,
      uptime: Math.round(overallUptime * 100) / 100,
      uptimeFormatted: `${Math.round(overallUptime * 100) / 100}%`,
    },
    services: SERVICES.map((s) => ({
      ...s,
      uptimeFormatted: `${s.uptime}%`,
      latencyFormatted: s.latencyMs >= 1000
        ? `${(s.latencyMs / 1000).toFixed(2)} s`
        : `${s.latencyMs} ms`,
    })),
    incidents: [],
    support: {
      contact: "Romain OGOU",
      role: "Fondateur & Lead Developer — OgouMEDICAL",
      email: TENANT.email,
      phone: TENANT.phone,
      availableHours: "Lun–Sam · 08h00–20h00 (GMT)",
      responseSla: "Réponse sous 2h ouvrées · Résolution sous 24h",
    },
    legal: {
      law: "Loi 2013-450 sur la protection des données personnelles (Côte d'Ivoire)",
      authority: "ARTCI — Autorité de Régulation des Télécommunications de Côte d'Ivoire",
      hosting: "AWS af-south-1 (Le Cap) — données hébergées en Afrique",
    },
  });
}
