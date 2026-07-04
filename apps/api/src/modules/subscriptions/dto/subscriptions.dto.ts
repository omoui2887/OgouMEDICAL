// ============================================================
// dto/subscriptions — DTOs abonnements SaaS
// ============================================================

import { z } from "zod";

export const ChangePlanSchema = z.object({
  plan: z.enum(["essentiel", "pro", "entreprise"]),
  billingCycle: z.enum(["mensuel", "annuel"]).default("mensuel"),
  paymentMethod: z.enum(["orange_money", "wave", "mtn_money", "card"]).optional(),
});
export type ChangePlanDto = z.infer<typeof ChangePlanSchema>;

export const UpdatePaymentMethodSchema = z.object({
  paymentMethod: z.enum(["orange_money", "wave", "mtn_money", "card"]),
  phone: z.string().optional(),
});
export type UpdatePaymentMethodDto = z.infer<typeof UpdatePaymentMethodSchema>;

export const CancelSubscriptionSchema = z.object({
  reason: z.string().min(5, "Raison requise (min 5 caractères)").max(500),
  immediate: z.boolean().default(false),
});
export type CancelSubscriptionDto = z.infer<typeof CancelSubscriptionSchema>;

/** Tarifs SaaS (FCFA) — source unique de vérité. */
export const PLAN_PRICING: Record<
  "essentiel" | "pro" | "entreprise",
  { mensuel: number; annuel: number; seats: number }
> = {
  essentiel: { mensuel: 25_000, annuel: 240_000, seats: 3 },
  pro: { mensuel: 75_000, annuel: 720_000, seats: 10 },
  entreprise: { mensuel: 200_000, annuel: 1_920_000, seats: 50 },
};
