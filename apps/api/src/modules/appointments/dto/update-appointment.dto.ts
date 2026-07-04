// ============================================================
// update-appointment.dto.ts — PATCH /appointments/:id
// ============================================================

import { z } from "zod";
import { CreateAppointmentSchema } from "./create-appointment.dto";

export const UpdateAppointmentSchema = CreateAppointmentSchema.partial().extend({
  status: z
    .enum(["planifie", "confirme", "en_cours", "termine", "annule", "absent"])
    .optional(),
});

export type UpdateAppointmentDto = z.infer<typeof UpdateAppointmentSchema>;
