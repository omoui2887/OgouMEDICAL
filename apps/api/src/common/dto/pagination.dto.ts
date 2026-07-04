// ============================================================
// pagination.dto.ts — DTO + schéma Zod pour la pagination
// ============================================================
// Paramètres de pagination standards de l'API :
//   ?page=1&pageSize=20&search=...&sortBy=createdAt&sortOrder=desc
// Tous les endpoints de liste l'acceptent via @Query().
// ============================================================

import { z } from "zod";

/** Schéma Zod de validation des paramètres de pagination. */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/** DTO de pagination dérivé du schéma Zod. */
export type PaginationDto = z.infer<typeof PaginationSchema>;

/** Helper pour calculer l'offset Prisma à partir de PaginationDto. */
export function toPrismaSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
