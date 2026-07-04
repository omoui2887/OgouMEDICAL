import { NextRequest, NextResponse } from "next/server";
import { searchIcd10 } from "@/lib/icd10";

// GET /api/icd10/search?q=...&limit=25 — Recherche CIM-10
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "25", 10) || 25, 100);

  if (!q.trim()) {
    return NextResponse.json({
      success: true,
      query: q,
      results: [],
      total: 0,
      message: "Paramètre « q » requis pour la recherche CIM-10",
    });
  }

  const results = searchIcd10(q, limit);

  return NextResponse.json({
    success: true,
    query: q,
    results,
    total: results.length,
  });
}
