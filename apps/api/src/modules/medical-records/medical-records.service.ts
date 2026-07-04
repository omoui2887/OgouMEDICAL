// ============================================================
// medical-records.service.ts — Consultations + Ordonnances + DPN médical
// ============================================================
// Centralise les opérations médicales :
//  - consultations : compte-rendu, signes vitaux, diagnostic
//  - prescriptions : ordonnances électroniques avec validité
//  - patient medical summary : vue agrégée du DPN médical
//
// Conformité Loi 2013-450 : toutes les écritures sont auditées.
// ============================================================

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateConsultationDto,
  CreatePrescriptionDto,
  UpdatePrescriptionDto,
} from "./dto/medical-records.dto";

type ConsultationWithRelations = Prisma.ConsultationGetPayload<{
  include: { patient: true; doctor: true; prescriptions: true };
}>;

type PrescriptionWithRelations = Prisma.PrescriptionGetPayload<{
  include: { patient: true; doctor: true };
}>;

/**
 * Service Dossier Médical — consultations, ordonnances, vue agrégée.
 */
@Injectable()
export class MedicalRecordsService {
  private readonly logger = new Logger(MedicalRecordsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ───────── CONSULTATIONS ─────────

  /**
   * Liste les consultations d'un patient (chronologie inversée).
   */
  async findConsultationsByPatient(
    tenantId: string,
    patientId: string,
  ): Promise<ConsultationWithRelations[]> {
    return this.prisma.consultation.findMany({
      where: { tenantId, patientId },
      include: { patient: true, doctor: true, prescriptions: true },
      orderBy: { date: "desc" },
    });
  }

  /**
   * Crée un compte-rendu de consultation. Si appointmentId est fourni,
   * le statut du RDV passe automatiquement à "termine".
   */
  async createConsultation(
    tenantId: string,
    dto: CreateConsultationDto,
  ): Promise<ConsultationWithRelations> {
    const consultation = await this.prisma.consultation.create({
      data: {
        tenant: { connect: { id: tenantId } },
        appointment: dto.appointmentId
          ? { connect: { id: dto.appointmentId } }
          : undefined,
        patient: { connect: { id: dto.patientId } },
        doctor: { connect: { id: dto.doctorId } },
        symptoms: dto.symptoms,
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        vitalsTemp: dto.vitalsTemp,
        vitalsTension: dto.vitalsTension,
        vitalsPulse: dto.vitalsPulse,
        vitalsWeight: dto.vitalsWeight,
        notes: dto.notes,
      },
      include: { patient: true, doctor: true, prescriptions: true },
    });

    // Marque le RDV comme terminé si lié
    if (dto.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: dto.appointmentId },
        data: { status: "termine" },
      });
    }

    this.logger.log(
      `Consultation créée — id=${consultation.id} patient=${dto.patientId}`,
    );
    return consultation;
  }

  // ───────── PRESCRIPTIONS ─────────

  /**
   * Liste les ordonnances d'un patient.
   */
  async findPrescriptionsByPatient(
    tenantId: string,
    patientId: string,
  ): Promise<PrescriptionWithRelations[]> {
    return this.prisma.prescription.findMany({
      where: { tenantId, patientId },
      include: { patient: true, doctor: true },
      orderBy: { date: "desc" },
    });
  }

  /**
   * Crée une ordonnance électronique. Génère un numéro unique au
   * format "ORD-YYYY-XXXX".
   */
  async createPrescription(
    tenantId: string,
    dto: CreatePrescriptionDto,
  ): Promise<PrescriptionWithRelations> {
    const year = new Date().getFullYear();
    const count = await this.prisma.prescription.count({
      where: { tenantId, number: { startsWith: `ORD-${year}-` } },
    });
    const number = `ORD-${year}-${String(count + 1).padStart(4, "0")}`;

    const prescription = await this.prisma.prescription.create({
      data: {
        tenant: { connect: { id: tenantId } },
        patient: { connect: { id: dto.patientId } },
        doctor: { connect: { id: dto.doctorId } },
        consultation: dto.consultationId
          ? { connect: { id: dto.consultationId } }
          : undefined,
        number,
        medications: JSON.stringify(dto.medications),
        validityDays: dto.validityDays,
        status: "active",
        notes: dto.notes,
      },
      include: { patient: true, doctor: true },
    });

    this.logger.log(`Ordonnance créée — number=${number} tenant=${tenantId}`);
    return prescription;
  }

  /**
   * Met à jour le statut d'une ordonnance (active → expiree/annulee).
   */
  async updatePrescriptionStatus(
    tenantId: string,
    id: string,
    dto: UpdatePrescriptionDto,
  ): Promise<PrescriptionWithRelations> {
    const prescription = await this.prisma.prescription.findFirst({
      where: { id, tenantId },
    });
    if (!prescription) throw new NotFoundException("Ordonnance introuvable");

    return this.prisma.prescription.update({
      where: { id },
      data: { status: dto.status },
      include: { patient: true, doctor: true },
    });
  }

  // ───────── DPN MÉDICAL (vue agrégée) ─────────

  /**
   * Renvoie la vue agrégée du Dossier Patient Numérique médical :
   * informations patient + consultations + ordonnances + allergies.
   * Utilisé par le portail patient et le médecin lors d'une consult.
   */
  async getPatientMedicalSummary(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const [consultations, prescriptions] = await Promise.all([
      this.findConsultationsByPatient(tenantId, patientId),
      this.findPrescriptionsByPatient(tenantId, patientId),
    ]);

    return {
      patient,
      allergies: this.parseJsonArray(patient.allergies),
      chronicConditions: this.parseJsonArray(patient.chronicConditions),
      consultations,
      prescriptions,
      // Statistiques rapides
      stats: {
        consultationsCount: consultations.length,
        prescriptionsCount: prescriptions.length,
        activePrescriptions: prescriptions.filter((p) => p.status === "active").length,
      },
    };
  }

  /** Helper : parse un champ JSON string en tableau (défensif). */
  private parseJsonArray(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
