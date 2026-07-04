/**
 * MediSaaS CI — Service Africa's Talking (SMS ivoiriens)
 * ============================================================
 * Fonctionnalités :
 *  1. Envoi de SMS via Africa's Talking API
 *  2. Réception de SMS entrants (webhooks)
 *  3. Templates de SMS en français pour la CI
 *  4. Gestion des erreurs et retry automatique (exponentiel)
 *  5. Coût estimé : 25-30 FCFA par SMS en Côte d'Ivoire
 *
 * Configuration :
 *   AFRICASTALKING_API_KEY=your_key
 *   AFRICASTALKING_USERNAME=medisaas_ci
 *   AFRICASTALKING_SENDER_ID=MEDISAAS
 *   AFRICASTALKING_SANDBOX=true|false
 *
 * @conformity Loi 2013-450 : opt-in patient, journalisation, pas de données médicales dans le SMS
 */
import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom, retry, catchError, timeout, throwError } from "rxjs";

@Injectable()
export class AfricasTalkingService {
  private readonly logger = new Logger(AfricasTalkingService.name);

  private readonly apiKey = process.env.AFRICASTALKING_API_KEY ?? "";
  private readonly username = process.env.AFRICASTALKING_USERNAME ?? "medisaas_ci";
  private readonly senderId = process.env.AFRICASTALKING_SENDER_ID ?? "MEDISAAS";
  private readonly sandbox = process.env.AFRICASTALKING_SANDBOX === "true";

  // Coût estimé par SMS en Côte d'Ivoire (25-30 FCFA)
  private readonly SMS_COST_FCFA = 28;

  private get baseUrl(): string {
    return this.sandbox
      ? "https://apis.sandbox.africastalking.com/version1"
      : "https://apis.africastalking.com/version1";
  }

  constructor(private readonly httpService: HttpService) {}

  /**
   * Envoie un SMS à un numéro ivoirien.
   * @param to Numéro au format international (+225XXXXXXXXXX)
   * @param message Contenu du SMS (max 160 caractères pour 1 SMS)
   * @returns Métadonnées du message (id, coût, statut)
   */
  async sendSms(to: string, message: string): Promise<SmsResult> {
    this.validateIvorianPhone(to);
    this.validateMessage(message);

    const payload = new URLSearchParams({
      username: this.username,
      to: this.formatPhone(to),
      message,
      from: this.senderId,
    });

    try {
      const response$ = this.httpService
        .post(`${this.baseUrl}/messaging`, payload.toString(), {
          headers: {
            apiKey: this.apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        })
        .pipe(
          timeout(10000), // 10s timeout
          retry({ count: 3, delay: (err, retryCount) => {
            // Backoff exponentiel : 1s, 2s, 4s
            const delayMs = Math.pow(2, retryCount - 1) * 1000;
            this.logger.warn(
              `Retry SMS #${retryCount} vers ${to} dans ${delayMs}ms : ${err.message}`
            );
            return delayMs;
          }}),
          catchError((err) => {
            this.logger.error(`Échec envoi SMS vers ${to} : ${err.message}`, err.stack);
            return throwError(() => new HttpException(
              { success: false, error: "Échec envoi SMS", detail: err.message },
              HttpStatus.SERVICE_UNAVAILABLE
            ));
          })
        );

      const { data } = await firstValueFrom(response$);

      const recipients = data?.SMSMessageData?.Recipients ?? [];
      const recipient = recipients[0];

      if (!recipient || recipient.status !== "Success") {
        throw new HttpException(
          { success: false, error: "SMS non délivré", status: recipient?.status ?? "Unknown" },
          HttpStatus.BAD_REQUEST
        );
      }

      this.logger.log(`SMS envoyé à ${to} (id=${recipient.messageId}, coût=${this.SMS_COST_FCFA} FCFA)`);

      return {
        success: true,
        messageId: recipient.messageId,
        cost: this.SMS_COST_FCFA,
        status: "Success",
        to: recipient.number,
      };
    } catch (err) {
      this.logger.error(`Erreur envoi SMS vers ${to}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Envoie un SMS en masse (à plusieurs destinataires).
   * Limite Africa's Talking : 1000 destinataires/requête.
   */
  async sendBulkSms(recipients: string[], message: string): Promise<BulkSmsResult> {
    if (recipients.length === 0) {
      throw new HttpException("Aucun destinataire", HttpStatus.BAD_REQUEST);
    }
    if (recipients.length > 1000) {
      throw new HttpException("Max 1000 destinataires par envoi", HttpStatus.BAD_REQUEST);
    }

    const to = recipients.map(this.formatPhone).join(",");
    const payload = new URLSearchParams({
      username: this.username,
      to,
      message,
      from: this.senderId,
    });

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/messaging`, payload.toString(), {
          headers: {
            apiKey: this.apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        })
      );

      const sent = data?.SMSMessageData?.Recipients ?? [];
      return {
        success: true,
        total: recipients.length,
        sent: sent.filter((r) => r.status === "Success").length,
        failed: sent.filter((r) => r.status !== "Success").length,
        cost: sent.length * this.SMS_COST_FCFA,
        messageId: sent[0]?.messageId,
      };
    } catch (err) {
      this.logger.error(`Erreur envoi groupé: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Envoie un OTP (mot de passe à usage unique) pour vérification téléphone.
   * L'OTP est valable 5 minutes.
   */
  async sendOtp(phone: string, code: string): Promise<SmsResult> {
    const message = `MediSaaS CI : votre code de vérification est ${code}. Ce code expire dans 5 minutes. Ne le partagez avec personne.`;
    return this.sendSms(phone, message);
  }

  /**
   * Webhook de réception de SMS entrants (Africa's Talking → POST).
   * Gère les réponses patient : "NON" = annulation de RDV.
   *
   * Format reçu :
   *   { id, text, from, to, date, linkId }
   */
  async handleInboundSms(payload: InboundSmsPayload): Promise<SmsAction | null> {
    this.logger.log(`SMS entrant de ${payload.from} : "${payload.text}"`);

    const text = payload.text?.trim().toUpperCase() ?? "";

    // Annulation par SMS : patient répond "NON"
    if (text === "NON" || text === "STOP" || text === "ANNULER") {
      this.logger.log(`Demande d'annulation par SMS de ${payload.from}`);
      return {
        type: "APPOINTMENT_CANCEL",
        phone: payload.from,
        reason: "Annulation par SMS patient",
      };
    }

    // Confirmation par SMS : patient répond "OUI"
    if (text === "OUI" || text === "OK" || text === "CONFIRMER") {
      this.logger.log(`Confirmation RDV par SMS de ${payload.from}`);
      return {
        type: "APPOINTMENT_CONFIRM",
        phone: payload.from,
      };
    }

    // Réponse libre → enregistrer pour suivi
    this.logger.log(`SMS libre de ${payload.from} : ${payload.text}`);
    return {
      type: "FREE_TEXT",
      phone: payload.from,
      text: payload.text,
    };
  }

  /**
   * Vérifie le solde du compte Africa's Talking.
   */
  async checkBalance(): Promise<{ balance: string }> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/user?username=${this.username}`, {
          headers: { apiKey: this.apiKey, Accept: "application/json" },
        })
      );
      return { balance: data?.UserData?.balance ?? "0" };
    } catch (err) {
      this.logger.error(`Erreur solde: ${err.message}`);
      throw err;
    }
  }

  // ---------- Helpers de validation ----------

  private validateIvorianPhone(phone: string): void {
    // Formats acceptés : +225 07/05/01/27 XX XX XX XX
    const cleaned = phone.replace(/\s/g, "");
    const regex = /^(\+225)?(07|05|01|27)\d{8}$/;
    if (!regex.test(cleaned)) {
      throw new HttpException(
        `Numéro ivoirien invalide : ${phone} (format attendu +225 07/05/01/27 XX XX XX XX)`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\s/g, "").replace(/^\+/, "");
    return `+${cleaned}`;
  }

  private validateMessage(message: string): void {
    if (!message || message.trim().length === 0) {
      throw new HttpException("Message vide", HttpStatus.BAD_REQUEST);
    }
    if (message.length > 918) {
      // Limite Africa's Talking : 918 caractères (multi-SMS)
      throw new HttpException("Message trop long (max 918 caractères)", HttpStatus.BAD_REQUEST);
    }
    // Conformité Loi 2013-450 : pas de données médicales sensibles dans le SMS
    const sensitiveKeywords = ["VIH", "SIDA", "cancer", "psychiatrie", "avortement"];
    const lower = message.toLowerCase();
    for (const kw of sensitiveKeywords) {
      if (lower.includes(kw.toLowerCase())) {
        throw new HttpException(
          `Donnée sensible détectée (« ${kw} ») — non conforme Loi 2013-450`,
          HttpStatus.BAD_REQUEST
        );
      }
    }
  }
}

// ---------- Types ----------

export interface SmsResult {
  success: boolean;
  messageId: string;
  cost: number; // FCFA
  status: string;
  to: string;
}

export interface BulkSmsResult {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  cost: number;
  messageId?: string;
}

export interface InboundSmsPayload {
  id: string;
  text: string;
  from: string;
  to: string;
  date: string;
  linkId?: string;
}

export type SmsAction =
  | { type: "APPOINTMENT_CANCEL"; phone: string; reason: string }
  | { type: "APPOINTMENT_CONFIRM"; phone: string }
  | { type: "FREE_TEXT"; phone: string; text: string };
