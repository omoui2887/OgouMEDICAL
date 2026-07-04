import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/register — Inscription cabinet (3 étapes)
// En production : Supabase Auth signUp + trigger handle_new_user + création tenant
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cabinetName, cabinetType, city, phone, firstName, lastName, email, password, plan } = body;

    // Validation basique (Zod côté client + ici)
    if (!cabinetName || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "Tous les champs requis doivent être renseignés" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // En production :
    // 1. Créer le tenant dans public.tenants
    // 2. supabase.auth.signUp({ email, password, options: { data: { first_name, last_name, role: 'admin_cabinet', tenant_id } } })
    // 3. Le trigger handle_new_user crée le profil dans public.users
    // 4. Créer l'abonnement (plan) via Stripe ou table subscriptions
    // 5. Envoyer email de vérification via Resend

    return NextResponse.json({
      success: true,
      message: "Cabinet créé. Un email de vérification a été envoyé à " + email,
      email,
      cabinetName,
      plan,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
