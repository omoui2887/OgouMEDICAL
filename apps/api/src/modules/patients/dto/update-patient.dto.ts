// ============================================================
// update-patient.dto.ts — DTO + schéma Zod pour PATCH /patients/:id
// ============================================================
// Tous les champs sont optionnels (partial). Le tenantId ne peut
// pas être modifié via cette route (isolation multi-tenant).
// ============================================================

import { z } from "zod";
import { CreatePatientSchema } from "./create-patient.dto";

/** Schéma de mise à jour — tous les champs optionnels. */
export const UpdatePatientSchema = CreatePatientSchema.partial().extend({
  status: z.enum(["actif", "inactif"]).optional(),
});

/** DTO de mise à jour patient. */
export type UpdatePatientDto = z.infer<typeof UpdatePatientSchema>;
