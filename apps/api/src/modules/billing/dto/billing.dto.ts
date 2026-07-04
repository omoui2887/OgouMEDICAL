// ============================================================
// dto/billing — Factures + paiements Mobile Money
// ============================================================

import { z } from "zod";

/** Ligne de facturation. */
export const InvoiceItemSchema = z.object({
  description: z.string().min(2).max(200),
  quantity: z.coerce.number().int().positive().max(999),
  unitPrice: z.coerce.number().int().nonnegative(), // FCFA (entier)
});
export type InvoiceItemDto = z.infer<typeof InvoiceItemSchema>;

/** Schéma de création d'une facture. */
export const CreateInvoiceSchema = z.object({
  patientId: z.string().min(1, "Patient requis"),
  items: z.array(InvoiceItemSchema).min(1, "Au moins 1 ligne"),
  taxRate: z.coerce.number().min(0).max(100).default(18), // TVA CI 18%
  dueDate: z.coerce.date().optional(),
});
export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;

/** Schéma d'initiation de paiement Mobile Money (CinetPay). */
export const InitiatePaymentSchema = z.object({
  invoiceId: z.string().min(1, "Facture requise"),
  amount: z.coerce.number().int().positive(), // FCFA
  method: z.enum(["orange_money", "wave", "mtn_money", "card"]),
  phone: z
    .string()
    .regex(/^(\+225|0)?\d{8,10}$/, "Numéro Mobile Money invalide")
    .optional(),
  payerName: z.string().max(120).optional(),
});
export type InitiatePaymentDto = z.infer<typeof InitiatePaymentSchema>;

/** Schéma du webhook CinetPay (callback serveur). */
export const CinetPayWebhookSchema = z.object({
  transaction_id: z.string(),
  status: z.string(),
  payment_reference: z.string().optional(),
  amount: z.coerce.number().optional(),
  currency: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CinetPayWebhookDto = z.infer<typeof CinetPayWebhookSchema>;
