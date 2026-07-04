/**
 * MediSaaS CI — Service de rappels automatiques
 * ============================================================
 * Cron qui s'exécute toutes les heures et envoie :
 *   - SMS 24h avant le RDV (via Africa's Talking)
 *   - WhatsApp 1h avant le RDV (via WhatsApp Cloud API)
 *
 * Gestion des réponses patient : "NON" par SMS = annulation
 *
 * @conformity Loi 2013-450 : opt-in patient, pas de données sensibles, audit
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AfricasTalkingService } from "./africas-talking.service";
import { WhatsAppService } from "./whatsapp.service";
import {
  reminder24hTemplate,
  reminder1hTemplate,
  validateTemplate,
} from "./templates/sms-templates";

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly smsService: AfricasTalkingService,
    private readonly whatsappService: WhatsAppService
  ) {}

  /**
   * CRON : toutes les heures à la minute 0
   * Envoie les rappels SMS 24h avant le RDV.
   */
  @Cron("0 * * * *")
  async send24hReminders() {
    this.logger.log("🕐 Cron : envoi des rappels SMS 24h…");

    try {
      // En production : SELECT FROM appointments WHERE ...
      //   appointment_date = NOW() + INTERVAL '24 hours' (à ±1h)
      //   AND reminder_sent_24h = FALSE
      //   AND status IN ('planifie', 'confirme')
      //   AND patient a opt-in SMS
      const dueAppointments = await this.fetchAppointmentsDueFor24hReminder();

      let sent = 0;
      let failed = 0;

      for (const apt of dueAppointments) {
        try {
          const template = reminder24hTemplate({
            patientFirstName: apt.patientFirstName,
            date: apt.dateFr,
            time: apt.time,
            doctorName: apt.doctorName,
            cabinetName: apt.cabinetName,
          });
          validateTemplate(template);

          await this.smsService.sendSms(apt.patientPhone, template.message);

          // Marquer comme envoyé
          await this.markReminderSent(apt.id, "24h");

          sent++;
          this.logger.log(`Rappel 24h envoyé à ${apt.patientPhone} (RDV ${apt.id})`);
        } catch (err) {
          failed++;
          this.logger.error(
            `Échec rappel 24h pour RDV ${apt.id} : ${err.message}`
          );
        }
      }

      this.logger.log(`✅ Rappels 24h : ${sent} envoyés, ${failed} échecs`);
    } catch (err) {
      this.logger.error(`Erreur cron rappels 24h : ${err.message}`, err.stack);
    }
  }

  /**
   * CRON : toutes les heures à la minute 0
   * Envoie les rappels WhatsApp 1h avant le RDV.
   */
  @Cron("0 * * * *")
  async send1hReminders() {
    this.logger.log("🕐 Cron : envoi des rappels WhatsApp 1h…");

    try {
      const dueAppointments = await this.fetchAppointmentsDueFor1hReminder();

      let sent = 0;
      let failed = 0;

      for (const apt of dueAppointments) {
        try {
          const template = reminder1hTemplate({
            patientFirstName: apt.patientFirstName,
            time: apt.time,
            doctorName: apt.doctorName,
            cabinetAddress: apt.cabinetAddress,
          });

          // WhatsApp via Meta Cloud API
          await this.whatsappService.sendTemplate(apt.patientPhone, "rdv_reminder_1h", {
            patient_name: apt.patientFirstName,
            doctor_name: apt.doctorName,
            time: apt.time,
            address: apt.cabinetAddress,
          });

          await this.markReminderSent(apt.id, "1h");

          sent++;
        } catch (err) {
          failed++;
          this.logger.error(
            `Échec rappel WhatsApp 1h pour RDV ${apt.id} : ${err.message}`
          );
        }
      }

      this.logger.log(`✅ Rappels 1h : ${sent} envoyés, ${failed} échecs`);
    } catch (err) {
      this.logger.error(`Erreur cron rappels 1h : ${err.message}`, err.stack);
    }
  }

  /**
   * CRON : toutes les nuits à 23h
   * Marque les RDV manqués comme "absent" et notifie.
   */
  @Cron("0 23 * * *")
  async markMissedAppointments() {
    this.logger.log("🕐 Cron : marquage des RDV manqués…");

    try {
      // UPDATE appointments SET status = 'absent'
      // WHERE appointment_date < CURRENT_DATE
      //   AND status IN ('planifie', 'confirme')
      //   AND end_time < CURRENT_TIME
      const missed = await this.fetchMissedAppointments();
      this.logger.log(`📝 ${missed.length} RDV marqués comme absents`);
    } catch (err) {
      this.logger.error(`Erreur marquage absents : ${err.message}`);
    }
  }

  // ---------- Helpers (mock — brancher PrismaService en prod) ----------

  private async fetchAppointmentsDueFor24hReminder(): Promise<DueAppointment[]> {
    // PROD :
    // return this.prisma.appointments.findMany({
    //   where: {
    //     appointment_date: { equals: dayjs().add(24, 'hour').format('YYYY-MM-DD') },
    //     start_time: { gte: dayjs().format('HH:mm'), lte: dayjs().add(1, 'hour').format('HH:mm') },
    //     reminder_sent_24h: false,
    //     status: { in: ['planifie', 'confirme'] },
    //     patient: { sms_consent: true },
    //   },
    //   include: { patient: true, doctor: { include: { user: true } } },
    // });
    return [];
  }

  private async fetchAppointmentsDueFor1hReminder(): Promise<DueAppointment[]> {
    return [];
  }

  private async fetchMissedAppointments(): Promise<DueAppointment[]> {
    return [];
  }

  private async markReminderSent(appointmentId: string, type: "24h" | "1h"): Promise<void> {
    // PROD :
    // await this.prisma.appointments.update({
    //   where: { id: appointmentId },
    //   data: type === '24h' ? { reminder_sent_24h: true } : { reminder_sent_1h: true },
    // });
    void appointmentId;
    void type;
  }
}

interface DueAppointment {
  id: string;
  patientFirstName: string;
  patientPhone: string;
  dateFr: string;
  time: string;
  doctorName: string;
  cabinetName: string;
  cabinetAddress: string;
}
