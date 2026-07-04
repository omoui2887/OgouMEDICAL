// ============================================================
// audit.service.ts — Conformité Loi ivoirienne 2013-450
// ============================================================
// Journal d'audit immuable — conserve au minimum 12 mois (art. 44).
// Actions journalisées : accès/écriture DPN, ordonnances, paiements,
// authentifications, changements de rôles, exports de données.
//
// L'accès au journal est restreint à admin_cabinet + super_admin.
// Les entrées ne peuvent JAMAIS être modifiées ou supprimées
// (immutabilité — append-only). Une tâche planifiée archive les
// logs > 24 mois vers stockage froid chiffré AES-256.
// ============================================================

import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { PaginationDto, toPrismaSkip } from "../../common/dto/pagination.dto";
import type { PaginatedResult } from "../../../../packages/shared-types/src";

type AuditLogEntry = Prisma.AuditLogGetPayload<Record<string, never>>;

/**
 * Service d'audit — lecture du journal (l'écriture est faite par
 * AuditInterceptor). Fournit aussi des exports pour conformité.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste paginée des entrées d'audit (filtrable par user/action/entity).
   */
  async findAll(
    tenantId: string | null,
    pagination: PaginationDto,
    filters?: { userId?: string; action?: string; entity?: string; from?: Date; to?: Date },
  ): Promise<PaginatedResult<AuditLogEntry>> {
    const { page, pageSize, sortBy, sortOrder } = pagination;

    const where: Prisma.AuditLogWhereInput = {};
    if (tenantId) where.tenantId = tenantId;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = { contains: filters.action };
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters?.from) where.createdAt.gte = filters.from;
      if (filters?.to) where.createdAt.lte = filters.to;
    }

    const orderBy: Prisma.AuditLogOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: toPrismaSkip(page, pageSize),
        take: pageSize,
        orderBy,
      }),
      this.prisma.auditLog.count({ where }),
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
   * Exporte le journal d'audit pour une période (CSV/JSON).
   * Utilisé pour les audits ARTCI et les demandes d'accès patients
   * (art. 33 Loi 2013-450 — droit d'accès aux données personnelles).
   */
  async exportRange(
    tenantId: string | null,
    from: Date,
    to: Date,
  ): Promise<AuditLogEntry[]> {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId: tenantId ?? undefined,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Écrit une entrée d'audit manuelle (hors intercepteur).
   * Utile pour les actions système (cron, webhooks CinetPay...).
   */
  async log(params: {
    tenantId?: string | null;
    userId?: string;
    action: string;
    entity?: string;
    entityId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLogEntry> {
    return this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId ?? null,
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity ?? null,
        entityId: params.entityId ?? null,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  }
}
