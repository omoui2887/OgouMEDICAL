// ============================================================
// sms.service.ts — Intégration Africa's Talking (SMS CI)
// ============================================================
// Africa's Talking = agrégateur SMS panafricain.
// Endpoint : POST https://api.africastalking.com/version1/messaging
// Sender ID MediSaaS (pré-enregistré chez l'ARTCI).
//
// Usage principal : rappels de RDV J-1 et J-jour, confirmation
// d'ordonnance, notification de paiement Mobile Money.
//
// Conformité Loi 2013-450 : consentement patient requis pour SMS
// (opt-in au moment de la création du dossier patient).
// ============================================================

import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** Résultat d'envoi SMS. */
export interface SmsResult {
  success: boolean;
  messageId?: string;
  cost?: string;
  error?: string;
}

/**
 * Service SMS via Africa's Talking.
 * Méthode principale : `sendSms(to, message)`.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor(
    private readonly config: ConfigService,
    @Inject("FETCH") private readonly fetchImpl: typeof fetch,
  ) {
    this.apiUrl =
      this.config.get<string>("app.africasTalking.apiUrl") ??
      "https://api.africastalking.com/version1";
    this.apiKey = this.config.get<string>("app.africasTalking.apiKey") ?? "";
    this.senderId =
      this.config.get<string>("app.africasTalking.senderId") ?? "MediSaaS";
  }

  /**
   * Envoie un SMS à un numéro ivoirien (format +225 XX XX XX XX XX).
   *
   * @param to - Numéro au format international (+225...)
   * @param message - Corps du SMS (max 160 chars, ou multipart au-delà)
   */
  async sendSms(to: string, message: string): Promise<SmsResult> {
    if (!this.apiKey) {
      this.logger.warn("Africa's Talking API key manquante — SMS simulé");
      return { success: false, error: "API key non configurée" };
    }

    // Normalisation du numéro (suppression espaces, préfixe +225 obligatoire)
    const normalized = this.normalizeIvorianNumber(to);
    if (!normalized) {
      return { success: false, error: "Numéro ivoirien invalide" };
    }

    const body = new URLSearchParams({
      username: "medisaas_ci",
      to: normalized,
      message,
      from: this.senderId,
    });

    this.logger.log(`Envoi SMS à ${normalized} (${message.length} chars)`);

    try {
      const response = await this.fetchImpl(`${this.apiUrl}/messaging`, {
        method: "POST",
        headers: {
          apiKey: this.apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: body.toString(),
      });

      const data = (await response.json()) as {
        SMSMessageData?: {
          Message?: string;
          Recipients?: Array<{
            statusCode: number;
            status: string;
            messageId: string;
            cost: string;
          }>;
        };
      };

      const recipient = data.SMSMessageData?.Recipients?.[0];
      if (recipient && recipient.statusCode === 101) {
        return {
          success: true,
          messageId: recipient.messageId,
          cost: recipient.cost,
        };
      }

      return {
        success: false,
        error: data.SMSMessageData?.Message ?? "Échec envoi SMS",
      };
    } catch (err) {
      this.logger.error(`Erreur SMS Africa's Talking — ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Normalise un numéro ivoirien vers +225XXXXXXXX.
   * Accepte : "07 07 07 07 07", "+2250707070707", "0707070707"...
   */
  private normalizeIvorianNumber(raw: string): string | null {
    const digits = raw.replace(/[\s\-().]/g, "");
    // Format CI à 10 chiffres depuis 2021 (ex: 07 07 07 07 07)
    if (/^\+225\d{10}$/.test(digits)) return digits;
    if (/^225\d{10}$/.test(digits)) return `+${digits}`;
    if (/^0\d{9}$/.test(digits)) return `+225${digits}`;
    return null;
  }
}
