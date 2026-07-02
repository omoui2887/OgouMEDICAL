import { NextResponse } from "next/server";
import { APPOINTMENTS } from "@/lib/mock-data";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ appointments: APPOINTMENTS, total: APPOINTMENTS.length });
}
