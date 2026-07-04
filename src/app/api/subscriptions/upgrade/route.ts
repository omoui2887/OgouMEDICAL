import { NextRequest, NextResponse } from "next/server";
import { PLANS, SUBSCRIPTION, TENANT } from "@/lib/mock-data";
import { formatFCFA, type Plan } from "@/lib/types";

const VALID_PLANS: Plan[] = ["essentiel", "pro", "entreprise"];

// POST /api/subscriptions/upgrade — Changement de plan d'abonnement
// Body: { plan: "essentiel" | "pro" | "entreprise", billingCycle?: "mensuel" | "annuel" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, billingCycle } = body as { plan?: Plan; billingCycle?: "mensuel" | "annuel" };

    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        {
          success: false,
          error: `Plan invalide. Plans valides : ${VALID_PLANS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const cycle: "mensuel" | "annuel" = billingCycle === "annuel" ? "annuel" : "mensuel";
    const targetPlan = PLANS.find((p) => p.id === plan);
    if (!targetPlan) {
      return NextResponse.json(
        { success: false, error: "Plan introuvable" },
        { status: 404 }
      );
    }

    const monthlyAmount = targetPlan.price;
    const amount = cycle === "annuel" ? monthlyAmount * 10 : monthlyAmount;
    const previousPlan = SUBSCRIPTION.plan;

    // En production : mise à jour Prisma + paiement GeniusPay + email confirmation
    const newSubscription = {
      tenantId: TENANT.id,
      plan,
      status: "actif" as const,
      billingCycle: cycle,
      amount,
      amountFormatted: formatFCFA(amount),
      seats: targetPlan.seats,
      usedSeats: SUBSCRIPTION.usedSeats,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(
        Date.now() + (cycle === "annuel" ? 365 : 30) * 86400000
      ).toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: `Plan mis à jour : ${previousPlan} → ${plan}`,
      previousPlan,
      newPlan: plan,
      subscription: newSubscription,
      payment: {
        amount,
        amountFormatted: formatFCFA(amount),
        cycle,
        nextBillingDate: newSubscription.currentPeriodEnd,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Erreur lors du changement de plan" },
      { status: 500 }
    );
  }
}
