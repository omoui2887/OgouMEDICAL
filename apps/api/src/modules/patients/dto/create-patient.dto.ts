// ============================================================
// create-patient.dto.ts — DTO + schéma Zod pour POST /patients
// ============================================================
// Création d'un Dossier Patient Numérique (DPN) — Loi 2013-450.
// Le tenantId est déduit du JWT (TenantGuard), pas envoyé par le client.
// ============================================================

import { z } from "zod";

/** Groupes sanguins valides. */
const BloodType = z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

/** Communes principales d'Abidjan (extensions possibles). */
const AbidjanCommunes = z
  .enum([
    "Abobo",
    "Adjamé",
    "Attécoubé",
    "Cocody",
    "Koumassi",
    "Marcory",
    "Plateau",
    "Port-Bouët",
    "Treichville",
    "Yopougon",
    "Bingerville",
    "Songon",
    "Autre",
  ])
  .or(z.string().min(2).max(50));

/** Schéma de création d'un patient. */
export const CreatePatientSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom ≥ 2 caractères").max(80),
  lastName: z.string().trim().min(2, "Nom ≥ 2 caractères").max(80),
  gender: z.enum(["M", "F"]),
  birthDate: z.coerce.date().optional(),
  phone: z
    .string()
    .regex(/^(\+225|0)?\d{8,10}$/, "Numéro ivoirien invalide")
    .optional(),
  email: z.string().email().toLowerCase().optional(),
  address: z.string().max(200).optional(),
  commune: AbidjanCommunes,
  bloodType: BloodType.optional(),
  weight: z.coerce.number().positive().max(500).optional(),
  height: z.coerce.number().positive().max(300).optional(),
  allergies: z.array(z.string().max(80)).default([]),
  chronicConditions: z.array(z.string().max(120)).default([]),
  emergencyContact: z.string().max(120).optional(),
  insuranceProvider: z.string().max(80).optional(),
  insuranceNumber: z.string().max(50).optional(),
});

/** DTO de création patient. */
export type CreatePatientDto = z.infer<typeof CreatePatientSchema>;
