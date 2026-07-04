// ============================================================
// dto/medical-records — DTOs consultation + prescription + DPN médical
// ============================================================

import { z } from "zod";

/** Schéma d'un médicament dans une ordonnance. */
export const MedicationSchema = z.object({
  name: z.string().min(2).max(120),
  dosage: z.string().min(1).max(50),
  frequency: z.string().min(1).max(80),
  duration: z.string().min(1).max(50),
  instructions: z.string().max(300).optional(),
});
export type MedicationDto = z.infer<typeof MedicationSchema>;

/** Schéma de création d'une consultation (compte-rendu médical). */
export const CreateConsultationSchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().min(1, "Patient requis"),
  doctorId: z.string().min(1, "Médecin requis"),
  symptoms: z.string().trim().min(3, "Symptômes requis").max(2000),
  diagnosis: z.string().trim().min(1, "Diagnostic requis").max(2000),
  treatment: z.string().trim().min(1, "Traitement requis").max(2000),
  vitalsTemp: z.coerce.number().min(30).max(45).optional(),
  vitalsTension: z.string().max(20).optional(),
  vitalsPulse: z.coerce.number().int().min(20).max(250).optional(),
  vitalsWeight: z.coerce.number().positive().max(500).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateConsultationDto = z.infer<typeof CreateConsultationSchema>;

/** Schéma de création d'une ordonnance. */
export const CreatePrescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient requis"),
  doctorId: z.string().min(1, "Médecin requis"),
  consultationId: z.string().optional(),
  medications: z.array(MedicationSchema).min(1, "Au moins 1 médicament"),
  validityDays: z.coerce.number().int().min(1).max(365).default(30),
  notes: z.string().max(2000).optional(),
});
export type CreatePrescriptionDto = z.infer<typeof CreatePrescriptionSchema>;

/** Schéma de mise à jour d'une ordonnance (statut uniquement). */
export const UpdatePrescriptionSchema = z.object({
  status: z.enum(["active", "expiree", "annulee"]),
});
export type UpdatePrescriptionDto = z.infer<typeof UpdatePrescriptionSchema>;
