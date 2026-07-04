import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "MediSaaS CI API",
    version: "1.0.0",
    description: "Plateforme de gestion médicale SaaS pour la Côte d'Ivoire",
    endpoints: [
      "/api/dashboard",
      "/api/patients",
      "/api/appointments",
      "/api/prescriptions",
      "/api/invoices",
      "/api/doctors",
      "/api/subscription",
    ],
  });
}
