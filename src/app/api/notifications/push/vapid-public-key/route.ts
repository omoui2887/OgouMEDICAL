import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/notifications/push/vapid-public-key — Clé publique VAPID pour Web Push
// Le navigateur l'utilise pour s'abonner au service push.
export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
    process.env.VAPID_PUBLIC_KEY ??
    // Clé de démonstration (en prod : générer avec web-push generate-vapid-keys)
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8";

  const configured = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY
  );

  return NextResponse.json({
    success: true,
    publicKey,
    configured,
    applicationServerKey: publicKey,
    subject: "mailto:ogouromain@gmail.com",
    provider: "Web Push Protocol (RFC 8030) + VAPID (RFC 8292)",
    instructions: {
      usage:
        "Le navigateur utilise cette clé pour s'abonner via PushManager.subscribe({ applicationServerKey }).",
      subscriptionEndpoint: "POST /api/notifications/push/subscribe",
      unsubscriptionEndpoint: "POST /api/notifications/push/unsubscribe",
    },
    note: configured
      ? "Clé VAPID chargée depuis l'environnement."
      : "Clé VAPID de démonstration. Configurez NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY en production.",
  });
}
