// ============================================================
// prisma.module.ts — Module global exposant PrismaService
// ============================================================
// @Global() : pas besoin d'importer PrismaModule dans chaque module.
// Toute la hiérarchie peut injecter PrismaService directement.
// ============================================================

import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
