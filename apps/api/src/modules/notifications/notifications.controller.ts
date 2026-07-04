/**
 * MediSaaS CI — Contrôleur Notifications (SMS / WhatsApp / Email)
 * Webhook entrant Africa's Talking : POST /notifications/sms/webhook
 * Envoi manuel : POST /notifications/sms/send
 */
import { Controller, Post, Get, Body, Headers, Ip, HttpCode, HttpStatus } from "@nestjs/common";
import { AfricasTalkingService } from "./africas-talking.service";
import { Logger } from "@nestjs/common";

@Controller("notifications")
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly smsService: AfricasTalkingService) {}

  /**
   * Webhook entrant Africa's Talking (réception de SMS patient).
   * Le patient répond "NON" pour annuler son RDV.
   * URL à configurer : https://medisaas-ci.com/api/notifications/sms/webhook
   */
  @Post("sms/webhook")
  @HttpCode(HttpStatus.OK)
  async inboundSms(
    @Body() body: { id?: string; text?: string; from?: string; to?: string; date?: string; linkId?: string },
    @Headers() headers: Record<string, string>,
    @Ip() ip: string
  ) {
    this.logger.log(`Webhook SMS entrant de ${body.from} : "${body.text}" (ip=${ip})`);

    // Audit (conformité Loi 2013-450)
    this.logger.log(
      JSON.stringify({ event: "INBOUND_SMS", from: body.from, text: body.text, ip, ua: headers["user-agent"] })
    );

    const action = await this.smsService.handleInboundSms({
      id: body.id ?? "",
      text: body.text ?? "",
      from: body.from ?? "",
      to: body.to ?? "",
      date: body.date ?? new Date().toISOString(),
      linkId: body.linkId,
    });

    // Traitement de l'action
    if (action?.type === "APPOINTMENT_CANCEL") {
      // TODO: appeler AppointmentsService.cancelByPhone(action.phone, action.reason)
      this.logger.log(`Annulation RDV déclenchée pour ${action.phone}`);
    } else if (action?.type === "APPOINTMENT_CONFIRM") {
      // TODO: appeler AppointmentsService.confirmByPhone(action.phone)
      this.logger.log(`Confirmation RDV déclenchée pour ${action.phone}`);
    }

    // Africa's Talking attend un 200 OK simple
    return { success: true, action: action?.type ?? "IGNORED" };
  }

  /**
   * Envoi manuel d'un SMS (admin uniquement).
   */
  @Post("sms/send")
  async sendSms(@Body() body: { to: string; message: string }) {
    if (!body.to || !body.message) {
      return { success: false, error: "Destinataire et message requis" };
    }
    const result = await this.smsService.sendSms(body.to, body.message);
    return result;
  }

  /**
   * Solde du compte Africa's Talking.
   */
  @Get("sms/balance")
  async balance() {
    return this.smsService.checkBalance();
  }

  /**
   * Webhook WhatsApp Business Cloud API (Meta).
   */
  @Get("whatsapp/webhook")
  whatsappVerify(
    @Body("hub.mode") mode: string,
    @Body("hub.verify_token") token: string,
    @Body("hub.challenge") challenge: string
  ) {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (mode === "subscribe" && token === verifyToken) {
      return challenge;
    }
    return { error: "Forbidden" };
  }
}
