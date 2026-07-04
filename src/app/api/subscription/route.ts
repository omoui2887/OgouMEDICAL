import { NextResponse } from "next/server";
import { SUBSCRIPTION, PLANS } from "@/lib/mock-data";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ subscription: SUBSCRIPTION, plans: PLANS });
}
