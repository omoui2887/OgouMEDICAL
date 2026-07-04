// ============================================================
// database.config.ts — Configuration PostgreSQL/Prisma
// ============================================================
// En production, PostgreSQL est utilisé (datasource Prisma dédiée).
// Les données sont chiffrées au repos (AES-256) et stockées en
// région af-south-1 (Cape Town) — souveraineté Côte d'Ivoire.
// ============================================================

import { registerAs } from "@nestjs/config";

/**
 * Configuration de la base de données principale.
 * URL PostgreSQL au format :
 * postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public
 */
export default registerAs("database", () => ({
  url:
    process.env.DATABASE_URL ??
    "postgresql://medisaas:medisaas@localhost:5432/medisaas?schema=public",
  schema: process.env.DATABASE_SCHEMA ?? "public",
  logQueries: process.env.DATABASE_LOG_QUERIES === "true",
  // Pool de connexions Prisma
  connectionLimit: Number.parseInt(process.env.DATABASE_CONNECTION_LIMIT ?? "10", 10),
}));
