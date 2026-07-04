import { NextRequest, NextResponse } from "next/server";

// POST /api/appointments/otp/verify
// Vérifie l'OTP saisi par le patient
export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: "Téléphone et code requis" },
        { status: 400 }
      );
    }

    // Récupérer l'OTP stocké
    const store = (globalThis as Record<string, unknown>).__otpStore as Map<string, { code: string; expires: number }> | undefined;
    const stored = store?.get(phone);

    if (!stored) {
      return NextResponse.json(
        { success: false, error: "Aucun code envoyé à ce numéro. Demandez un nouveau code." },
        { status: 404 }
      );
    }

    if (Date.now() > stored.expires) {
      store?.delete(phone);
      return NextResponse.json(
        { success: false, error: "Code expiré. Demandez un nouveau code." },
        { status: 410 }
      );
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { success: false, error: "Code incorrect" },
        { status: 401 }
      );
    }

    // Code valide → on supprime
    store?.delete(phone);

    // En production : créer une session patient temporaire (token JWT court)
    return NextResponse.json({
      success: true,
      verified: true,
      phone,
      message: "Téléphone vérifié. Vous pouvez prendre rendez-vous.",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur vérification OTP" },
      { status: 500 }
    );
  }
}
