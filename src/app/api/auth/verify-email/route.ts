import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/verify-email — Confirmation d'email (callback Supabase)
// En production : Supabase redirige vers /auth/verify-email?token_hash=...&type=signup
export async function POST(req: NextRequest) {
  try {
    const { tokenHash, type } = await req.json();

    if (!tokenHash) {
      return NextResponse.json(
        { success: false, error: "Token de vérification manquant" },
        { status: 400 }
      );
    }

    // En production :
    // const { data, error } = await supabase.auth.verifyOtp({
    //   token_hash: tokenHash,
    //   type: type || "signup",
    // });

    return NextResponse.json({
      success: true,
      message: "Email vérifié avec succès. Vous pouvez vous connecter.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Token invalide ou expiré" },
      { status: 400 }
    );
  }
}
