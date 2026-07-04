import { NextRequest, NextResponse } from "next/server";

interface NotificationPreferences {
  patientId: string;
  channels: {
    sms: { enabled: boolean; categories: string[] };
    whatsapp: { enabled: boolean; categories: string[] };
    email: { enabled: boolean; categories: string[] };
    push: { enabled: boolean; categories: string[] };
    in_app: { enabled: boolean; categories: string[] };
  };
  language: "fr" | "en";
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "07:00"
  };
  consent: {
    marketing: boolean;
    appointmentReminders: boolean;
    medicalResults: boolean;
    billingReminders: boolean;
    consentedAt: string | null;
    consentVersion: string;
  };
  updatedAt: string;
}

const DEFAULT_PREFERENCES = (): NotificationPreferences => ({
  patientId: "default",
  channels: {
    sms: { enabled: true, categories: ["appointment", "billing", "urgent"] },
    whatsapp: { enabled: false, categories: ["appointment"] },
    email: { enabled: true, categories: ["appointment", "billing", "medical", "marketing"] },
    push: { enabled: false, categories: ["appointment"] },
    in_app: { enabled: true, categories: ["appointment", "billing", "medical", "marketing"] },
  },
  language: "fr",
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "07:00",
  },
  consent: {
    marketing: false,
    appointmentReminders: true,
    medicalResults: true,
    billingReminders: true,
    consentedAt: null,
    consentVersion: "1.0",
  },
  updatedAt: new Date().toISOString(),
});

// Mock : store partagé en mémoire (en prod : table patient_notification_preferences)
const PREFERENCES_STORE = new Map<string, NotificationPreferences>();

// GET /api/notifications/preferences?patientId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId") ?? "default";

  const prefs = PREFERENCES_STORE.get(patientId) ?? DEFAULT_PREFERENCES();

  return NextResponse.json({
    success: true,
    patientId,
    preferences: prefs,
    availableCategories: [
      { value: "appointment", label: "Rendez-vous", description: "Confirmations, rappels 24h/1h, annulations" },
      { value: "billing", label: "Facturation", description: "Factures émises, paiements reçus, retards" },
      { value: "medical", label: "Médical", description: "Résultats d'analyses, ordonnances, comptes-rendus" },
      { value: "marketing", label: "Marketing", description: "Newsletter, promotions (consentement explicite requis)" },
      { value: "urgent", label: "Urgent", description: "Alertes médicales critiques (non désactivable)" },
    ],
    availableChannels: [
      { value: "sms", label: "SMS", provider: "Africa's Talking", cost: "28 FCFA/msg" },
      { value: "whatsapp", label: "WhatsApp", provider: "Meta Cloud API", cost: "15 FCFA/msg" },
      { value: "email", label: "Email", provider: "Resend", cost: "1 FCFA/msg" },
      { value: "push", label: "Notification push", provider: "Web Push VAPID", cost: "Gratuit" },
      { value: "in_app", label: "In-app", provider: "Supabase Realtime", cost: "Gratuit" },
    ],
    legal: {
      law: "Loi 2013-450 du 19 juin 2013",
      consentRequired: "Le consentement explicite est requis pour SMS/WhatsApp/Email marketing",
      rightToWithdraw: "Le patient peut retirer son consentement à tout moment",
      retention: "Préférences conservées tant que le compte est actif",
    },
  });
}

// PUT /api/notifications/preferences — Met à jour les préférences
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId") ?? "default";

    const body = await req.json() as Partial<NotificationPreferences>;
    const current = PREFERENCES_STORE.get(patientId) ?? DEFAULT_PREFERENCES();

    // Fusion récursive simple (1 niveau)
    const merged: NotificationPreferences = {
      ...current,
      ...body,
      patientId,
      channels: {
        ...current.channels,
        ...(body.channels ?? {}),
      },
      consent: {
        ...current.consent,
        ...(body.consent ?? {}),
        consentedAt: body.consent ? new Date().toISOString() : current.consent.consentedAt,
      },
      quietHours: {
        ...current.quietHours,
        ...(body.quietHours ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };

    // Si marketing activé mais consentement marketing false → forcer consentement true
    const marketingActiveSomewhere =
      merged.channels.sms.categories.includes("marketing") && merged.channels.sms.enabled ||
      merged.channels.whatsapp.categories.includes("marketing") && merged.channels.whatsapp.enabled ||
      merged.channels.email.categories.includes("marketing") && merged.channels.email.enabled;
    if (marketingActiveSomewhere && !merged.consent.marketing) {
      merged.consent.marketing = true;
      merged.consent.consentedAt = new Date().toISOString();
    }

    PREFERENCES_STORE.set(patientId, merged);

    return NextResponse.json({
      success: true,
      message: "Préférences de notification mises à jour",
      patientId,
      preferences: merged,
      audit: {
        action: "preferences.update",
        law: "Loi 2013-450 — droit du patient sur ses données",
        timestamp: merged.updatedAt,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour des préférences" },
      { status: 500 }
    );
  }
}
