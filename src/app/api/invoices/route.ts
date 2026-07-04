import { NextResponse } from "next/server";
import { INVOICES, PAYMENTS } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/types";

export const dynamic = "force-static";

export async function GET() {
  const totalRevenue = INVOICES
    .filter((i) => i.status === "payee")
    .reduce((s, i) => s + (i.paidAmount ?? i.total), 0);
  const outstanding = INVOICES
    .filter((i) => i.status === "impayee" || i.status === "partielle")
    .reduce((s, i) => s + (i.total - (i.paidAmount ?? 0)), 0);

  return NextResponse.json({
    invoices: INVOICES,
    payments: PAYMENTS,
    total: INVOICES.length,
    totalRevenue,
    totalRevenueFormatted: formatFCFA(totalRevenue),
    outstanding,
    outstandingFormatted: formatFCFA(outstanding),
  });
}
