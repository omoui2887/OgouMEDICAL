// ============================================================
// login.dto.ts — DTO + schéma Zod pour POST /auth/login
// ============================================================

import { z } from "zod";

/** Schéma de validation du payload de login. */
export const LoginSchema = z.object({
  email: z.string().email("Email invalide").toLowerCase().trim(),
  password: z.string().min(8, "Mot de passe ≥ 8 caractères").max(128),
});

/** DTO de login. */
export type LoginDto = z.infer<typeof LoginSchema>;
