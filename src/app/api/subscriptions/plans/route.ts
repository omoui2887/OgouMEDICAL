import { NextResponse } from "next/server";
import { PLANS, SUBSCRIPTION, TENANT } from "@/lib/mock-data";
import { formatFCFA, type Plan } from "@/lib/types";

export const dynamic = "force-static";

// GET /api/subscriptions/plans — Liste des 3 plans d'abonnement SaaS
export async function GET() {
  const plans = PLANS.map((p) => ({
    ...p,
    priceFormatted: formatFCFA(p.price),
    yearlyPrice: p.price * 10, // 2 mois offerts en annuel
    yearlyPriceFormatted: formatFCFA(p.price * 10),
  }));

  return NextResponse.json({
    success: true,
    plans,
    currentSubscription: {
      ...SUBSCRIPTION,
      amountFormatted: formatFCFA(SUBSCRIPTION.amount),
    },
    tenant: {
      id: TENANT.id,
      name: TENANT.name,
    },
    billingCycles: [
      { value: "mensuel", label: "Mensuel", discount: 0 },
      { value: "annuel", label: "Annuel", discount: 2, discountLabel: "2 mois offerts" },
    ],
  });
}
