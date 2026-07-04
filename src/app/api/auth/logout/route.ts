import { NextResponse } from "next/server";

// POST /api/auth/logout — Déconnexion
export async function POST() {
  // En production : supabase.auth.signOut()
  const response = NextResponse.json({ success: true, message: "Déconnecté" });
  response.cookies.delete("medisaas-role");
  response.cookies.delete("medisaas-auth-token");
  return response;
}
