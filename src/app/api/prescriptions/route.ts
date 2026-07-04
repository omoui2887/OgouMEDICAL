import { NextResponse } from "next/server";
import { PRESCRIPTIONS } from "@/lib/mock-data";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ prescriptions: PRESCRIPTIONS, total: PRESCRIPTIONS.length });
}
