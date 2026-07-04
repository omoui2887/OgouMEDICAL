// ============================================================
// email.service.ts — Intégration Resend (emails transactionnels)
// ============================================================
// Resend = API email moderne (alternative SendGrid/Mailgun).
// Endpoint : POST https://api.resend.com/emails
// Auth : Bearer API key.
//
// Usage principal :
//  - Confirmation d'inscription (admin cabinet / patient)
//  - Reçu de paiement Mobile Money (PDF en pièce jointe)
//  - Alerte de renouvellement d'abonnement SaaS
//  - Rapport mensuel d'activité pour l'admin_cabinet
// ============================================================

import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** Données d'un template email (HTML + variables). */
export interface EmailTemplate {
  /** Sujet de l'email. */
  subject: string;
  /** Corps HTML de l'email. */
  html: string;
  /** Texte brut alternatif (optionnel). */
  text?: string;
}

/** Résultat d'envoi email. */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Service Email via Resend.
 * Méthode principale : `sendEmail(to, template, data)`.
 *
 * @remarks
 * Les templates HTML sont actuellement générés par code (TemplateEngine
 * basique). Pour passer à React Email, importer @react-email/render et
 * pré-rendre les templates côté serveur.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(
    private readonly config: ConfigService,
    @Inject("FETCH") private readonly fetchImpl: typeof fetch,
  ) {
    this.apiUrl =
      this.config.get<string>("app.resend.apiUrl") ?? "https://api.resend.com";
    this.apiKey = this.config.get<string>("app.resend.apiKey") ?? "";
    this.fromEmail =
      this.config.get<string>("app.resend.fromEmail") ??
      "MediSaaS CI <noreply@medisaas.ci>";
  }

  /**
   * Envoie un email transactionnel via Resend.
   *
   * @param to - Adresse email du destinataire.
   * @param template - Template (subject + html).
   * @param data - Variables à substituer dans {{clé}}.
   */
  async sendEmail(
    to: string,
    template: EmailTemplate,
    data?: Record<string, string | number>,
  ): Promise<EmailResult> {
    if (!this.apiKey) {
      this.logger.warn("Resend API key manquante — email simulé");
      return { success: false, error: "API key non configurée" };
    }

    // Substitution des variables {{clé}} dans subject et html
    const renderedSubject = this.render(template.subject, data);
    const renderedHtml = this.render(template.html, data);
    const renderedText = template.text ? this.render(template.text, data) : undefined;

    const body = {
      from: this.fromEmail,
      to,
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedText,
    };

    this.logger.log(`Envoi email à ${to} — sujet="${renderedSubject}"`);

    try {
      const response = await this.fetchImpl(`${this.apiUrl}/emails`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const resData = (await response.json()) as {
        id?: string;
        error?: { message: string };
      };

      if (!response.ok || resData.error) {
        return {
          success: false,
          error: resData.error?.message ?? `Erreur Resend (${response.status})`,
        };
      }

      return { success: true, messageId: resData.id };
    } catch (err) {
      this.logger.error(`Erreur Resend — ${(err as Error).message}`);
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Substitution basique des variables {{clé}} dans un template.
   */
  private render(
    template: string,
    data?: Record<string, string | number>,
  ): string {
    if (!data) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      return String(data[key] ?? match);
    });
  }
}
