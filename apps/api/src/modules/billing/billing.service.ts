// ============================================================
// billing.service.ts — Logique facturation + paiements Mobile Money
// ============================================================
// TVA Côte d'Ivoire : 18 % par défaut sur les prestations médicales
// (sauf exceptions réglementaires).
// ============================================================

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CinetPayService } from "./cinetpay.service";
import { PaginationDto, toPrismaSkip } from "../../common/dto/pagination.dto";
import type { PaginatedResult } from "../../../../packages/shared-types/src";
import {
  CreateInvoiceDto,
  InitiatePaymentDto,
} from "./dto/billing.dto";

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: { patient: true; payments: true };
}>;

/**
 * Service de facturation MediSaaS CI.
 * Gère le cycle de vie d'une facture : création → émission →
 * encaissement Mobile Money → clôture.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cinetpay: CinetPayService,
  ) {}

  /**
   * Liste paginée des factures du tenant, avec filtres statut/méthode.
   */
  async findAll(
    tenantId: string,
    pagination: PaginationDto,
    filters?: { status?: string; method?: string },
  ): Promise<PaginatedResult<InvoiceWithRelations>> {
    const { page, pageSize, search, sortBy, sortOrder } = pagination;

    const where: Prisma.InvoiceWhereInput = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.method) {
      where.payments = { some: { method: filters.method } };
    }
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const orderBy: Prisma.InvoiceOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: toPrismaSkip(page, pageSize),
        take: pageSize,
        orderBy,
        include: { patient: true, payments: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(tenantId: string, id: string): Promise<InvoiceWithRelations> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { patient: true, payments: true },
    });
    if (!invoice) throw new NotFoundException(`Facture ${id} introuvable`);
    return invoice;
  }

  /**
   * Crée une nouvelle facture. Le total est calculé automatiquement
   * (sous-total + TVA 18 %).
   */
  async create(tenantId: string, dto: CreateInvoiceDto): Promise<InvoiceWithRelations> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { tenantId, number: { startsWith: `FAC-${year}-` } },
    });
    const number = `FAC-${year}-${String(count + 1).padStart(5, "0")}`;

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const tax = Math.round((subtotal * dto.taxRate) / 100);
    const total = subtotal + tax;

    const invoice = await this.prisma.invoice.create({
      data: {
        tenant: { connect: { id: tenantId } },
        patient: { connect: { id: dto.patientId } },
        number,
        dueDate: dto.dueDate,
        items: JSON.stringify(dto.items),
        subtotal,
        tax,
        total,
        status: "impayee",
      },
      include: { patient: true, payments: true },
    });

    this.logger.log(
      `Facture créée — number=${number} total=${total} XOF tenant=${tenantId}`,
    );
    return invoice;
  }

  /**
   * Initie un paiement Mobile Money via CinetPay pour une facture.
   * Vérifie que la facture n'est pas déjà soldée.
   */
  async initiatePayment(
    tenantId: string,
    dto: InitiatePaymentDto,
  ): Promise<{ paymentUrl: string; transactionId: string }> {
    const invoice = await this.findOne(tenantId, dto.invoiceId);

    if (invoice.status === "payee") {
      throw new BadRequestException("Facture déjà soldée");
    }

    const paid = invoice.payments
      .filter((p) => p.status === "reussi")
      .reduce((sum, p) => sum + p.amount, 0);
    const remaining = invoice.total - paid;
    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Montant supérieur au reste à payer (${remaining} XOF)`,
      );
    }

    // Pour Wave et carte, le téléphone n'est pas obligatoire
    if (dto.method !== "card" && dto.method !== "wave" && !dto.phone) {
      throw new BadRequestException(
        `Numéro Mobile Money requis pour ${dto.method}`,
      );
    }

    return this.cinetpay.initiatePayment({
      invoiceId: invoice.id,
      amount: dto.amount,
      method: dto.method,
      phone: dto.phone,
      payerName: dto.payerName,
      tenantId,
    });
  }

  /**
   * Statistiques facturation : total encaissé, impayé, taux de recouvrement.
   */
  async getStats(tenantId: string): Promise<{
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    collectionRate: number;
    invoiceCount: number;
    paidCount: number;
    partialCount: number;
    unpaidCount: number;
  }> {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId },
      include: { payments: true },
    });

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce(
      (sum, inv) =>
        sum +
        inv.payments
          .filter((p) => p.status === "reussi")
          .reduce((s, p) => s + p.amount, 0),
      0,
    );
    const totalOutstanding = totalInvoiced - totalPaid;
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      collectionRate: Math.round(collectionRate * 100) / 100,
      invoiceCount: invoices.length,
      paidCount: invoices.filter((i) => i.status === "payee").length,
      partialCount: invoices.filter((i) => i.status === "partielle").length,
      unpaidCount: invoices.filter((i) => i.status === "impayee").length,
    };
  }
}
