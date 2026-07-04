// ============================================================
// patients.service.ts — Logique métier Dossier Patient Numérique
// ============================================================
// CRUD multi-tenant : toutes les requêtes filtrent par tenantId.
// Le code patient est généré au format "CI-CP-XXXX" (préfixe CI).
// ============================================================

import { Injectable, NotFoundException, ConflictException, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  PaginationDto,
  toPrismaSkip,
} from "../../common/dto/pagination.dto";
import type { PaginatedResult } from "../../../../packages/shared-types/src";
import { CreatePatientDto } from "./dto/create-patient.dto";
import { UpdatePatientDto } from "./dto/update-patient.dto";

/** Type Patient avec relations utiles (sans données sensibles en plus). */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type PatientWithRelations = Prisma.PatientGetPayload<{}>;

/**
 * Service de gestion des dossiers patients (DPN).
 * Toutes les méthodes reçoivent un tenantId pour garantir l'isolation
 * multi-tenant — un admin cabinet ne peut jamais voir les patients
 * d'un autre cabinet (conformité Loi 2013-450).
 */
@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée des patients du tenant, avec recherche full-text
   * sur nom/prénom/code/téléphone.
   */
  async findAll(
    tenantId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<PatientWithRelations>> {
    const { page, pageSize, search, sortBy, sortOrder } = pagination;

    const where: Prisma.PatientWhereInput = { tenantId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const orderBy: Prisma.PatientOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip: toPrismaSkip(page, pageSize),
        take: pageSize,
        orderBy,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Récupère un patient par ID (vérifie l'appartenance au tenant).
   * @throws NotFoundException si introuvable ou hors tenant.
   */
  async findOne(tenantId: string, id: string): Promise<PatientWithRelations> {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${id} introuvable`);
    }
    return patient;
  }

  /**
   * Crée un nouveau patient et génère son code unique CI-CP-XXXX.
   */
  async create(tenantId: string, dto: CreatePatientDto): Promise<PatientWithRelations> {
    const code = await this.generatePatientCode(tenantId);

    // Sérialisation JSON pour allergies + antécédents (SQLite/Postgres)
    const data: Prisma.PatientCreateInput = {
      tenant: { connect: { id: tenantId } },
      code,
      firstName: dto.firstName,
      lastName: dto.lastName,
      gender: dto.gender,
      birthDate: dto.birthDate,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      bloodType: dto.bloodType,
      weight: dto.weight,
      height: dto.height,
      allergies: JSON.stringify(dto.allergies ?? []),
      chronicConditions: JSON.stringify(dto.chronicConditions ?? []),
      emergencyContact: dto.emergencyContact,
      insuranceProvider: dto.insuranceProvider,
      insuranceNumber: dto.insuranceNumber,
      status: "actif",
    };

    const patient = await this.prisma.patient.create({ data });
    this.logger.log(`Patient créé — code=${code} tenant=${tenantId}`);
    return patient;
  }

  /**
   * Met à jour un patient existant (vérifie tenant).
   */
  async update(
    tenantId: string,
    id: string,
    dto: UpdatePatientDto,
  ): Promise<PatientWithRelations> {
    // Vérifie l'existence + appartenance au tenant
    await this.findOne(tenantId, id);

    const data: Prisma.PatientUpdateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      gender: dto.gender,
      birthDate: dto.birthDate,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      bloodType: dto.bloodType,
      weight: dto.weight,
      height: dto.height,
      allergies: dto.allergies ? JSON.stringify(dto.allergies) : undefined,
      chronicConditions: dto.chronicConditions
        ? JSON.stringify(dto.chronicConditions)
        : undefined,
      emergencyContact: dto.emergencyContact,
      insuranceProvider: dto.insuranceProvider,
      insuranceNumber: dto.insuranceNumber,
      status: dto.status,
    };

    // Nettoyage des undefined pour éviter d'écraser avec null
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.patient.update({ where: { id }, data: cleaned });
  }

  /**
   * Désactive un patient (soft-delete — pas de suppression physique,
   * pour conformité Loi 2013-450 — conservation des dossiers médicaux).
   */
  async deactivate(tenantId: string, id: string): Promise<PatientWithRelations> {
    await this.findOne(tenantId, id);
    return this.prisma.patient.update({
      where: { id },
      data: { status: "inactif" },
    });
  }

  /**
   * Génère un code patient unique au format "CI-CP-XXXX" (incrémental).
   */
  private async generatePatientCode(tenantId: string): Promise<string> {
    const count = await this.prisma.patient.count({ where: { tenantId } });
    const next = String(count + 1).padStart(4, "0");
    const code = `CI-CP-${next}`;

    // Vérifie l'unicité (collision possible si données importées)
    const existing = await this.prisma.patient.findFirst({
      where: { tenantId, code },
    });
    if (existing) {
      throw new ConflictException("Code patient en collision — réessayez");
    }
    return code;
  }
}
