// ============================================================
// register.dto.ts — DTO + schéma Zod pour POST /auth/register
// ============================================================
// Inscription d'un nouvel utilisateur (admin_cabinet à l'onboarding
// ou patient via portail). Le tenantId est déduit du contexte.
// ============================================================

import { z } from "zod";

/** Rôles autorisés à l'inscription via cette route. */
const RegisterRole = z.enum(["admin_cabinet", "medecin", "secretaire", "comptable", "patient"]);

/** Schéma de validation du payload d'inscription. */
export const RegisterSchema = z
  .object({
    email: z.string().email("Email invalide").toLowerCase().trim(),
    password: z
      .string()
      .min(8, "Mot de passe ≥ 8 caractères")
      .max(128)
      // Politique de mot de passe — conformité Loi 2013-450 (sécurité)
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[a-z]/, "Au moins une minuscule")
      .regex(/[0-9]/, "Au moins un chiffre"),
    name: z.string().min(2, "Nom ≥ 2 caractères").max(100),
    role: RegisterRole.default("patient"),
    phone: z
      .string()
      .regex(/^(\+225|0)?\d{8,10}$/, "Numéro ivoirien invalide")
      .optional(),
    tenantSlug: z.string().min(2).max(50).optional(),
    // Pour les médecins
    specialty: z.string().max(100).optional(),
    licenseNumber: z.string().max(50).optional(),
  })
  .refine(
    (data) => data.role !== "medecin" || (!!data.specialty && !!data.licenseNumber),
    {
      message: "Spécialité et numéro d'ordre requis pour les médecins",
      path: ["specialty"],
    },
  );

/** DTO d'inscription. */
export type RegisterDto = z.infer<typeof RegisterSchema>;
