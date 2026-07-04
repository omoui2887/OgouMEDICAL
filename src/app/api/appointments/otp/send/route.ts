import { NextRequest, NextResponse } from "next/server";

// POST /api/appointments/otp/send
// Envoie un OTP par SMS via Africa's Talking pour vérifier le téléphone patient
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Numéro de téléphone requis" },
        { status: 400 }
      );
    }

    // Validation format ivoirien
    const cleaned = phone.replace(/\s/g, "");
    const isValid = /^(\+225)?(07|05|01|27)\d{8}$/.test(cleaned);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Numéro ivoirien invalide (ex: +225 07 08 12 34 56)" },
        { status: 400 }
      );
    }

    // Générer OTP 6 chiffres
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // En production : appeler Africa's Talking
    // await africasTalking.sendSms(phone, `MediSaaS CI : votre code est ${code}. Expire dans 5 min.`)
    // Stocker l'OTP en DB (table otp_codes) avec expiration 5 min

    // Mock : on stocke dans une map globale (en prod : Redis ou table)
    if (typeof globalThis !== "undefined") {
      (globalThis as Record<string, unknown>).__otpStore = (globalThis as Record<string, unknown>).__otpStore ?? new Map();
      ((globalThis as Record<string, unknown>).__otpStore as Map<string, { code: string; expires: number }>).set(phone, {
        code,
        expires: Date.now() + 5 * 60 * 1000,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Code OTP envoyé par SMS au ${phone}`,
      // En démo : on renvoie le code (à NE PAS faire en prod !)
      ...(process.env.NODE_ENV !== "production" ? { demoCode: code } : {}),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur envoi OTP" },
      { status: 500 }
    );
  }
}
