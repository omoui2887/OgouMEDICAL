import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/forgot-password — Envoi email réinitialisation via Resend
// En production : supabase.auth.resetPasswordForEmail(email, { redirectTo })
// + template email Resend
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email requis" },
        { status: 400 }
      );
    }

    // En production :
    // 1. supabase.auth.resetPasswordForEmail(email, { redirectTo: `${APP_URL}/auth/reset-password` })
    // 2. Resend envoie le template email (voir src/lib/email-templates/reset-password.tsx)
    // 3. Pour des raisons de sécurité, toujours retourner success (même si l'email n'existe pas)

    return NextResponse.json({
      success: true,
      message: "Si un compte existe pour " + email + ", un email de réinitialisation a été envoyé.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
