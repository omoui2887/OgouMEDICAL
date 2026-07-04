// ============================================================
// whatsapp.service.ts — WhatsApp Cloud API (Meta)
// ============================================================
// WhatsApp Business Cloud API = envoi de messages templates pré-approuvés.
// Endpoint : POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
// Auth : Bearer Access Token Meta Business.
//
// Usage principal : rappels RDV, ordonnances en PDF, confirmation
// de paiement, lien de téléconsultation.
//
// Conformité Loi 2013-450 : opt-in explicite patient obligatoire,
// templates pré-approuvés par Meta (pas de marketing non sollicité).
// ============================================================

import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** Paramètres d'un template WhatsApp (langue, composants). */
export interface WhatsAppTemplateParams {
  /** Code langue au format "fr" ou "fr_CI". */
  language: string;
  /** Composants variables du template, dans l'ordre défini chez Meta. */
  parameters: Array<{
    type: "text" | "currency" | "date_time";
    text?: string;
    currency?: { fallback_value: string; code: string; amount_1000: number };
    date_time?: { fallback_value: string };
  }>;
}

/** Résultat d'envoi WhatsApp. */
export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Service WhatsApp Cloud API.
 * Méthode principale : `sendTemplate(to, templateName, params)`.
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(
    private readonly config: ConfigService,
    @Inject("FETCH") private readonly fetchImpl: typeof fetch,
  ) {
    this.apiUrl =
      this.config.get<string>("app.whatsapp.apiUrl") ??
      "https://graph.facebook.com/v18.0";
    this.phoneNumberId =
      this.config.get<string>("app.whatsapp.phoneNumberId") ?? "";
    this.accessToken =
      this.config.get<string>("app.whatsapp.accessToken") ?? "";
  }

  /**
   * Envoie un message WhatsApp basé sur un template pré-approuvé Meta.
   *
   * @param to - Numéro du destinataire (format +225XXXXXXXXXX).
   * @param templateName - Nom du template approuvé dans WhatsApp Manager.
   * @param params - Paramètres (langue + composants variables).
   */
  async sendTemplate(
    to: string,
    templateName: string,
    params: WhatsAppTemplateParams,
  ): Promise<WhatsAppResult> {
    if (!this.accessToken || !this.phoneNumberId) {
      this.logger.warn("WhatsApp Cloud API non configurée — message simulé");
      return { success: false, error: "Configuration manquante" };
    }

    const normalized = this.normalizeNumber(to);
    if (!normalized) {
      return { success: false, error: "Numéro WhatsApp invalide" };
    }

    const body = {
      messaging_product: "whatsapp",
      to: normalized,
      type: "template",
      template: {
        name: templateName,
        language: { code: params.language },
        components: [
          {
            type: "body",
            parameters: params.parameters.map((p) =>
              p.type === "text"
                ? { type: "text", text: p.text }
                : p.type === "currency"
                  ? { type: "currency", currency: p.currency }
                  : { type: "date_time", date_time: p.date_time },
            ),
          },
        ],
      },
    };

    this.logger.log(`Envoi WhatsApp template="${templateName}" à ${normalized}`);

    try {
      const response = await this.fetchImpl(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = (await response.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message: string };
      };

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error?.message ?? `Erreur WhatsApp (${response.status})`,
        };
      }

      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (err) {
      this.logger.error(`Erreur WhatsApp — ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  /** Normalise un numéro au format international sans "+". */
  private normalizeNumber(raw: string): string | null {
    const digits = raw.replace(/[\s\-().+]/g, "");
    if (/^225\d{10}$/.test(digits)) return digits;
    if (/^0\d{9}$/.test(digits)) return `225${digits}`;
    return null;
  }
}
