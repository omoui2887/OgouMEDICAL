// ============================================================
// create-appointment.dto.ts — DTO + schéma Zod POST /appointments
// ============================================================

import { z } from "zod";

export const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1, "Patient requis"),
  doctorId: z.string().min(1, "Médecin requis"),
  date: z.coerce.date({ message: "Date invalide" }),
  duration: z.coerce.number().int().min(5).max(480).default(30),
  reason: z.string().trim().min(3, "Motif ≥ 3 caractères").max(300),
  type: z.enum(["presentiel", "teleconsultation"]).default("presentiel"),
  notes: z.string().max(1000).optional(),
});

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;
