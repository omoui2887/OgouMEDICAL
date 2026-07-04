// ============================================================
// patients.controller.ts — Routes CRUD /patients
// ============================================================

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PatientsService } from "./patients.service";
import { CreatePatientDto, CreatePatientSchema } from "./dto/create-patient.dto";
import { UpdatePatientDto, UpdatePatientSchema } from "./dto/update-patient.dto";
import {
  PaginationDto,
  PaginationSchema,
} from "../../common/dto/pagination.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Audit } from "../../common/interceptors/audit.interceptor";

/**
 * Contrôleur Dossier Patient Numérique (DPN).
 * @Roles : admin_cabinet, medecin, secretaire (lecture + écriture),
 *          patient (lecture propre — via portail), comptable (lecture seule).
 */
@ApiTags("patients")
@Controller("patients")
@UseGuards()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Liste paginée des patients du cabinet courant.
   */
  @Get()
  @Roles("admin_cabinet", "medecin", "secretaire", "comptable")
  @ApiOperation({ summary: "Liste paginée des patients (DPN)" })
  @ApiResponse({ status: 200, description: "Liste paginée" })
  findAll(
    @CurrentTenant() tenantId: string | null,
    @Query(new ZodValidationPipe(PaginationSchema)) pagination: PaginationDto,
  ) {
    // super_admin sans tenantId doit fournir ?tenantId=xxx (gestion multi)
    if (!tenantId) {
      return { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 };
    }
    return this.patientsService.findAll(tenantId, pagination);
  }

  /**
   * Récupère le DPN complet d'un patient par ID.
   */
  @Get(":id")
  @Roles("admin_cabinet", "medecin", "secretaire", "comptable", "patient")
  @Audit("patient.view", "patient")
  @ApiOperation({ summary: "Détail d'un patient (DPN)" })
  @ApiResponse({ status: 200, description: "Dossier patient" })
  @ApiResponse({ status: 404, description: "Patient introuvable" })
  findOne(@CurrentTenant() tenantId: string | null, @Param("id") id: string) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.patientsService.findOne(tenantId, id);
  }

  /**
   * Crée un nouveau dossier patient.
   */
  @Post()
  @Roles("admin_cabinet", "medecin", "secretaire")
  @Audit("patient.create", "patient")
  @ApiOperation({ summary: "Créer un dossier patient (DPN)" })
  @ApiResponse({ status: 201, description: "Patient créé" })
  @UsePipes(new ZodValidationPipe(CreatePatientSchema))
  create(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CreatePatientDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.patientsService.create(tenantId, dto);
  }

  /**
   * Met à jour un dossier patient.
   */
  @Patch(":id")
  @Roles("admin_cabinet", "medecin", "secretaire")
  @Audit("patient.update", "patient")
  @ApiOperation({ summary: "Modifier un dossier patient" })
  @UsePipes(new ZodValidationPipe(UpdatePatientSchema))
  update(
    @CurrentTenant() tenantId: string | null,
    @Param("id") id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.patientsService.update(tenantId, id, dto);
  }

  /**
   * Désactive un patient (soft-delete — Loi 2013-450 : conservation).
   */
  @Delete(":id")
  @Roles("admin_cabinet")
  @Audit("patient.deactivate", "patient")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Désactiver un patient (soft-delete)" })
  deactivate(@CurrentTenant() tenantId: string | null, @Param("id") id: string) {
    if (!tenantId) throw new Error("Tenant requis");
    return this.patientsService.deactivate(tenantId, id);
  }
}
