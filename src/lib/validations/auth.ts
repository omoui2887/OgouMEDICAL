// ============================================================
// MediSaaS CI — Schémas de validation Zod (authentification)
// ============================================================
import { z } from "zod";

// Mot de passe : min 8 caractères, 1 majuscule, 1 chiffre
const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Doit contenir au moins une majuscule")
  .regex(/[0-9]/, "Doit contenir au moins un chiffre");

// Email
const emailSchema = z
  .string()
  .min(1, "L'email est requis")
  .email("Format d'email invalide");

// Téléphone ivoirien : +225 07/05/01/27 XX XX XX XX
const phoneIvorianSchema = z
  .string()
  .regex(/^(\+225)?\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/, "Numéro ivoirien invalide (ex: +225 07 08 12 34 56)")
  .or(z.string().min(8, "Téléphone requis"));

// ---------- LOGIN ----------
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

// ---------- REGISTER — Étape 1 : Cabinet ----------
export const registerStep1Schema = z.object({
  cabinetName: z.string().min(2, "Le nom du cabinet est requis"),
  cabinetType: z.enum(["cabinet", "clinique", "polyclinique"], {
    errorMap: () => ({ message: "Sélectionnez un type" }),
  }),
  city: z.string().min(2, "La ville est requise"),
  phone: phoneIvorianSchema,
});

// ---------- REGISTER — Étape 2 : Administrateur ----------
export const registerStep2Schema = z.object({
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// ---------- REGISTER — Étape 3 : Plan ----------
export const registerStep3Schema = z.object({
  plan: z.enum(["freemium", "starter", "pro"], {
    errorMap: () => ({ message: "Choisissez un plan" }),
  }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les conditions" }),
  }),
});

// ---------- FORGOT PASSWORD ----------
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// ---------- Types inférés ----------
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Input = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Input = z.infer<typeof registerStep3Schema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
