/**
 * MediSaaS CI — Contrôleur Appointments (backend NestJS)
 * CRUD + créneaux disponibles + rappels manuels
 * Conformité : RBAC + tenant isolation + audit Loi 2013-450
 */
import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, UseGuards, ParseUUIDPipe,
} from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@Controller("appointments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Liste les RDV du tenant (filtres optionnels).
   * GET /appointments?doctorId=...&date=...&status=...&patientId=...
   */
  @Get()
  @Roles("super_admin", "admin_cabinet", "medecin", "secretaire", "patient", "comptable")
  findAll(
    @CurrentTenant() tenantId: string | null,
    @Query("doctorId") doctorId?: string,
    @Query("patientId") patientId?: string,
    @Query("date") date?: string,
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.appointmentsService.findAll({
      tenantId,
      doctorId,
      patientId,
      date,
      status,
      from,
      to,
    });
  }

  /**
   * Détail d'un RDV.
   */
  @Get(":id")
  @Roles("super_admin", "admin_cabinet", "medecin", "secretaire", "patient")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.appointmentsService.findOne(id);
  }

  /**
   * Crée un RDV + envoie confirmation SMS (si demandé).
   * POST /appointments
   */
  @Post()
  @Roles("super_admin", "admin_cabinet", "medecin", "secretaire", "patient")
  create(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CreateAppointmentDto
  ) {
    return this.appointmentsService.create({ ...dto, tenantId });
  }

  /**
   * Met à jour un RDV (statut, notes, déplacement).
   */
  @Patch(":id")
  @Roles("super_admin", "admin_cabinet", "medecin", "secretaire")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto
  ) {
    return this.appointmentsService.update(id, dto);
  }

  /**
   * Annule un RDV (soft delete — jamais de suppression physique, Loi 2013-450).
   */
  @Delete(":id")
  @Roles("super_admin", "admin_cabinet", "medecin", "secretaire", "patient")
  cancel(@Param("id", ParseUUIDPipe) id: string, @Body() body: { reason?: string }) {
    return this.appointmentsService.cancel(id, body.reason);
  }

  /**
   * Récupère les créneaux disponibles pour un médecin un jour donné.
   * GET /appointments/slots?doctorId=...&date=YYYY-MM-DD
   */
  @Get("slots/available")
  @Roles("super_admin", "admin_cabinet", "medecin", "secretaire", "patient")
  getAvailableSlots(
    @Query("doctorId", ParseUUIDPipe) doctorId: string,
    @Query("date") date: string,
    @Query("duration") duration?: number
  ) {
    return this.appointmentsService.getAvailableSlots(doctorId, date, duration ?? 30);
  }

  /**
   * Déplace un RDV (drag & drop calendrier).
   * PATCH /appointments/:id/reschedule
   */
  @Patch(":id/reschedule")
  @Roles("super_admin", "admin_cabinet", "medecin", "secretaire")
  reschedule(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: { appointmentDate: string; startTime: string; endTime: string }
  ) {
    return this.appointmentsService.reschedule(id, dto);
  }

  /**
   * Renvoie manuellement le SMS de rappel (admin).
   */
  @Post(":id/reminder")
  @Roles("super_admin", "admin_cabinet", "secretaire")
  sendReminder(@Param("id", ParseUUIDPipe) id: string) {
    return this.appointmentsService.sendReminder(id);
  }
}

// ---------- DTOs (validation Zod côté pipe) ----------

export interface CreateAppointmentDto {
  tenantId?: string | null;
  patientId: string;
  doctorId: string;
  appointmentDate: string;   // YYYY-MM-DD
  startTime: string;          // HH:mm
  endTime: string;            // HH:mm
  type: "consultation" | "suivi" | "teleconsultation" | "urgence" | "visite_domicile";
  motif?: string;
  notes?: string;
  consultationFee?: number;
  sendSmsConfirmation?: boolean;
}

export interface UpdateAppointmentDto {
  status?: "planifie" | "confirme" | "en_cours" | "termine" | "annule" | "absent";
  motif?: string;
  notes?: string;
  consultationFee?: number;
  isPaid?: boolean;
}
