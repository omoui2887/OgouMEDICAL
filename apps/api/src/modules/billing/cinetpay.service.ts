// ============================================================
// cinetpay.service.ts — Intégration CinetPay (Orange/Wave/MTN Money)
// ============================================================
// CinetPay = agrégateur de paiement Mobile Money pour l'Afrique de
// l'Ouest. URLs officielles :
//  - API checkout : https://api-checkout.cinetpay.com/v2/payment
//  - API vérif    : https://api-checkout.cinetpay.com/v2/payment/check
//  - Webhook      : POST {NOTIFY_URL} (callback serveur après paiement)
//
// Flux standard :
//   1. initiatePayment() → obtient un payment_url CinetPay
//   2. Redirection utilisateur vers CinetPay (paiement Orange/Wave/MTN)
//   3. CinetPay appelle notify_url (handleWebhook) → on enregistre le paiement
//   4. Frontend interroge verifyPayment() pour confirmer le statut
//
// Conformité Loi 2013-450 : aucune donnée médicale envoyée à CinetPay.
// On ne transmet que : amount, currency, customer name, transaction_id.
// ============================================================

import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

/** Méthodes Mobile Money supportées par CinetPay (Côte d'Ivoire). */
export type MobileMoneyMethod = "orange_money" | "wave" | "mtn_money" | "card";

/** Réponse de l'API CinetPay /v2/payment. */
interface CinetPayPaymentResponse {
  status: string; // "ACCEPTED" | "REFUSED" | ...
  code?: string;
  message?: string;
  data?: {
    payment_url?: string;
    payment_token?: string;
  };
}

/** Réponse de vérification d'une transaction CinetPay. */
export interface CinetPayVerifyResult {
  transactionId: string;
  status: "pending" | "success" | "failed";
  amount: number;
  method?: MobileMoneyMethod;
  paymentReference?: string;
  customerName?: string;
}

/** Payload de création de paiement envoyé à CinetPay. */
interface CinetPayPaymentPayload {
  apikey: string;
  site_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  description: string;
  customer_name: string;
  customer_surname: string;
  customer_email?: string;
  customer_phone_number?: string;
  notify_url: string;
  return_url: string;
  channels: string; // "MOBILE_MONEY,CREDIT_CARD,WAVE"
  metadata?: Record<string, unknown>;
}

/**
 * Service d'intégration CinetPay.
 *
 * Méthodes principales :
 *  - `initiatePayment(amount, method, phone)` → démarre un paiement Mobile Money
 *  - `verifyPayment(transactionId)` → interroge CinetPay pour confirmer
 *  - `handleWebhook(payload)` → callback serveur après paiement
 */
@Injectable()
export class CinetPayService {
  private readonly logger = new Logger(CinetPayService.name);
  private readonly apiUrl: string;
  private readonly siteId: string;
  private readonly apiKey: string;
  private readonly notifyUrl: string;
  private readonly returnUrl: string;

  constructor(
    private readonly config: ConfigService,
    @Inject("FETCH") private readonly fetchImpl: typeof fetch,
    private readonly prisma: PrismaService,
  ) {
    this.apiUrl = this.config.get<string>("app.cinetpay.apiUrl") ?? "";
    this.siteId = this.config.get<string>("app.cinetpay.siteId") ?? "";
    this.apiKey = this.config.get<string>("app.cinetpay.apiKey") ?? "";
    this.notifyUrl = this.config.get<string>("app.cinetpay.notifyUrl") ?? "";
    this.returnUrl = this.config.get<string>("app.cinetpay.returnUrl") ?? "";
  }

  /**
   * Démarre un paiement Mobile Money via CinetPay.
   *
   * @returns URL de redirection CinetPay (à ouvrir côté frontend).
   */
  async initiatePayment(params: {
    invoiceId: string;
    amount: number;
    method: MobileMoneyMethod;
    phone?: string;
    payerName?: string;
    tenantId: string;
  }): Promise<{ paymentUrl: string; transactionId: string }> {
    // transaction_id doit être unique — préfixe "MS-" + timestamp + random
    const transactionId = `MS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const channels =
      params.method === "card"
        ? "CREDIT_CARD"
        : params.method === "wave"
          ? "WAVE"
          : "MOBILE_MONEY";

    const payload: CinetPayPaymentPayload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: transactionId,
      amount: params.amount,
      currency: "XOF", // Franc CFA
      description: `Paiement facture MediSaaS CI #${params.invoiceId}`,
      customer_name: params.payerName?.split(" ")[0] ?? "Patient",
      customer_surname: params.payerName?.split(" ").slice(1).join(" ") ?? "MediSaaS",
      customer_phone_number: params.phone,
      notify_url: this.notifyUrl,
      return_url: this.returnUrl,
      channels,
      // Jamais de données médicales — uniquement facture + tenant
      metadata: {
        invoiceId: params.invoiceId,
        tenantId: params.tenantId,
      },
    };

    this.logger.log(
      `Initiation paiement CinetPay — tx=${transactionId} amount=${params.amount} XOF method=${params.method}`,
    );

    const response = await this.fetchImpl(`${this.apiUrl}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`CinetPay HTTP ${response.status}: ${text}`);
      throw new Error(`Erreur CinetPay (${response.status})`);
    }

    const data = (await response.json()) as CinetPayPaymentResponse;
    if (data.status !== "ACCEPTED" || !data.data?.payment_url) {
      throw new Error(`CinetPay refusé : ${data.message ?? "raison inconnue"}`);
    }

    return { paymentUrl: data.data.payment_url, transactionId };
  }

  /**
   * Vérifie le statut d'une transaction CinetPay (interrogation manuelle).
   */
  async verifyPayment(transactionId: string): Promise<CinetPayVerifyResult> {
    const response = await this.fetchImpl(`${this.apiUrl}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: transactionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Vérification CinetPay échouée (${response.status})`);
    }

    const data = (await response.json()) as {
      status: string;
      data?: {
        amount?: number;
        payment_reference?: string;
        customer_name?: string;
        method?: string;
      };
    };

    const status: CinetPayVerifyResult["status"] =
      data.status === "REFUSED"
        ? "failed"
        : data.status === "ACCEPTED"
          ? "success"
          : "pending";

    return {
      transactionId,
      status,
      amount: data.data?.amount ?? 0,
      paymentReference: data.data?.payment_reference,
      customerName: data.data?.customer_name,
      method: data.data?.method as MobileMoneyMethod | undefined,
    };
  }

  /**
   * Traite le webhook CinetPay (callback serveur après paiement).
   * Idempotent : peut être appelé plusieurs fois pour le même tx_id.
   */
  async handleWebhook(payload: {
    transaction_id: string;
    status: string;
    amount?: number;
    payment_reference?: string;
    metadata?: { invoiceId?: string; tenantId?: string };
  }): Promise<{ recorded: boolean; paymentId?: string }> {
    this.logger.log(
      `Webhook CinetPay reçu — tx=${payload.transaction_id} status=${payload.status}`,
    );

    if (payload.status !== "ACCEPTED") {
      this.logger.warn(`Webhook CinetPay — statut non-Accepted ignoré`);
      return { recorded: false };
    }

    // Idempotence : si un paiement avec ce provider existe déjà, on skip
    const existing = await this.prisma.payment.findFirst({
      where: { provider: payload.transaction_id },
    });
    if (existing) {
      this.logger.log(`Paiement déjà enregistré — id=${existing.id}, skip`);
      return { recorded: false, paymentId: existing.id };
    }

    const invoiceId = payload.metadata?.invoiceId;
    if (!invoiceId) {
      this.logger.error("Webhook CinetPay — invoiceId manquant dans metadata");
      return { recorded: false };
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoice: { connect: { id: invoiceId } },
        amount: payload.amount ?? 0,
        method: "orange_money", // FIXME: à déduire de data.method (voir verifyPayment)
        provider: payload.transaction_id,
        reference: payload.payment_reference ?? null,
        status: "reussi",
        payerName: null,
        phone: null,
      },
    });

    // Recalcule le statut de la facture (payée / partielle)
    await this.recomputeInvoiceStatus(invoiceId);

    this.logger.log(`Paiement enregistré — id=${payment.id} invoice=${invoiceId}`);
    return { recorded: true, paymentId: payment.id };
  }

  /**
   * Recalcule le statut d'une facture après un paiement.
   * Met à jour en base selon le total payé vs total dû.
   */
  private async recomputeInvoiceStatus(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) return;

    const paid = invoice.payments
      .filter((p) => p.status === "reussi")
      .reduce((sum, p) => sum + p.amount, 0);

    const status = paid >= invoice.total ? "payee" : paid > 0 ? "partielle" : "impayee";

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status },
    });
  }
}
