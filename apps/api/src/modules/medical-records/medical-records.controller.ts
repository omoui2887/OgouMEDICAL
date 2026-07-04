// ============================================================
// medical-records.controller.ts — DPN médical, consultations, ordonnances
// ============================================================

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MedicalRecordsService } from "./medical-records.service";
import {
  CreateConsultationSchema,
  CreateConsultationDto,
  CreatePrescriptionSchema,
  CreatePrescriptionDto,
  UpdatePrescriptionSchema,
  UpdatePrescriptionDto,
} from "./dto/medical-records.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Audit } from "../../common/interceptors/audit.interceptor";

/**
 * Contrôleur Dossier Médical.
 * Routes organisées par sous-ressource :
 *   /medical-records/patients/:id/summary   — vue DPN agrégée
 *   /medical-records/consultations          — CRUD consultations
 *   /medical-records/prescriptions          — CRUD ordonnances
 */
@ApiTags("medical-records")
@Controller("medical-records")
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  // ───────── DPN MÉDICAL ─────────

  /**
   * Vue agrégée du DPN médical (patient + consultations + ordonnances).
   */
  @Get("patients/:id/summary")
  @Roles("admin_cabinet", "medecin", "patient")
  @Audit("medical_record.view", "patient")
  @ApiOperation({ summary: "Dossier médical agrégé d'un patient (DPN)" })
  @ApiResponse({ status: 200, description: "Vue DPN complète" })
  getPatientSummary(
    @CurrentTenant() tenantId: string | null,
    @Param("id") patientId: string,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.medicalRecordsService.getPatientMedicalSummary(tenantId, patientId);
  }

  // ───────── CONSULTATIONS ─────────

  @Get("patients/:id/consultations")
  @Roles("admin_cabinet", "medecin", "patient")
  @Audit("consultation.list", "consultation")
  @ApiOperation({ summary: "Historique des consultations d'un patient" })
  listConsultations(
    @CurrentTenant() tenantId: string | null,
    @Param("id") patientId: string,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.medicalRecordsService.findConsultationsByPatient(tenantId, patientId);
  }

  @Post("consultations")
  @Roles("medecin", "admin_cabinet")
  @Audit("consultation.create", "consultation")
  @ApiOperation({ summary: "Créer un compte-rendu de consultation" })
  @UsePipes(new ZodValidationPipe(CreateConsultationSchema))
  createConsultation(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CreateConsultationDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.medicalRecordsService.createConsultation(tenantId, dto);
  }

  // ───────── PRESCRIPTIONS ─────────

  @Get("patients/:id/prescriptions")
  @Roles("admin_cabinet", "medecin", "patient")
  @Audit("prescription.list", "prescription")
  @ApiOperation({ summary: "Historique des ordonnances d'un patient" })
  listPrescriptions(
    @CurrentTenant() tenantId: string | null,
    @Param("id") patientId: string,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.medicalRecordsService.findPrescriptionsByPatient(tenantId, patientId);
  }

  @Post("prescriptions")
  @Roles("medecin", "admin_cabinet")
  @Audit("prescription.create", "prescription")
  @ApiOperation({ summary: "Créer une ordonnance électronique" })
  @UsePipes(new ZodValidationPipe(CreatePrescriptionSchema))
  createPrescription(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CreatePrescriptionDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.medicalRecordsService.createPrescription(tenantId, dto);
  }

  @Patch("prescriptions/:id")
  @Roles("medecin", "admin_cabinet")
  @Audit("prescription.update", "prescription")
  @ApiOperation({ summary: "Modifier le statut d'une ordonnance" })
  @UsePipes(new ZodValidationPipe(UpdatePrescriptionSchema))
  updatePrescription(
    @CurrentTenant() tenantId: string | null,
    @Param("id") id: string,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.medicalRecordsService.updatePrescriptionStatus(tenantId, id, dto);
  }
}
