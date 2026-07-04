import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/login — Authentification email/mot de passe
// En production : utilise @supabase/supabase-js → supabase.auth.signInWithPassword
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Mock : accepte admin@clinique-plateau.ci / demo1234
    const validCredentials = [
      { email: "admin@clinique-plateau.ci", role: "admin_cabinet", name: "Dr. Aya Kouassi" },
      { email: "medecin@clinique-plateau.ci", role: "medecin", name: "Dr. Konan Yao" },
      { email: "secretaire@clinique-plateau.ci", role: "secretaire", name: "Affoué Tanoh" },
      { email: "comptable@clinique-plateau.ci", role: "comptable", name: "Yves Adou" },
      { email: "patient@gmail.com", role: "patient", name: "Kouadio Brou" },
    ];
    const user = validCredentials.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && password === "demo1234"
    );

    if (!user) {
      // Audit de l'échec (conformité Loi 2013-450)
      return NextResponse.json(
        { success: false, error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // En prod : créer une session JWT Supabase + cookie httpOnly
    const response = NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.role === "patient" ? null : "ten_clinique_plateau",
        tenantName: "Clinique du Plateau",
      },
    });

    // Cookie de session (httpOnly en prod)
    response.cookies.set("medisaas-role", user.role, {
      httpOnly: false, // true en production
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
