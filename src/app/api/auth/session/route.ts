import { NextResponse } from "next/server";

// GET /api/auth/session — Récupère la session courante
// En production : supabase.auth.getSession()
export async function GET() {
  // Mock : lit le cookie de rôle pour la démo
  // En prod : vérifie le JWT Supabase et retourne l'utilisateur + tenant + abonnement
  return NextResponse.json({
    authenticated: false,
    user: null,
    message: "Utiliser /api/auth/login pour s'authentifier",
  });
}
