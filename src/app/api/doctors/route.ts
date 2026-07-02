import { NextResponse } from "next/server";
import { DOCTORS } from "@/lib/mock-data";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ doctors: DOCTORS, total: DOCTORS.length });
}
