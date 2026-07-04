import { NextRequest, NextResponse } from "next/server";
import { INVOICES, PAYMENTS, TENANT } from "@/lib/mock-data";
import { formatFCFA, formatDate, formatDateTime, type PaymentMethod } from "@/lib/types";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  orange_money: "Orange Money",
  wave: "Wave",
  mtn_money: "MTN Money",
  card: "Carte bancaire",
  cash: "Espèces",
};

// GET /api/billing/receipt/[id] — Données du reçu PDF pour une facture ou un paiement
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Recherche d'abord dans les paiements, puis factures
  const payment = PAYMENTS.find((p) => p.id === id || p.reference === id);
  const invoice = INVOICES.find((i) => i.id === id || i.number === id);

  if (!payment && !invoice) {
    return NextResponse.json(
      { success: false, error: "Reçu introuvable (ni paiement ni facture)" },
      { status: 404 }
    );
  }

  // Cas 1 : reçu de paiement
  if (payment) {
    const linkedInvoice = INVOICES.find((i) => i.id === payment.invoiceId);
    return NextResponse.json({
      success: true,
      receiptType: "payment",
      meta: {
        documentType: "Reçu de paiement",
        receiptNumber: payment.reference,
        generatedAt: new Date().toISOString(),
        locale: "fr-FR",
        paperSize: "A5",
      },
      tenant: {
        name: TENANT.name,
        phone: TENANT.phone,
        email: TENANT.email,
        address: TENANT.address,
        district: TENANT.district,
      },
      payment: {
        id: payment.id,
        reference: payment.reference,
        amount: payment.amount,
        amountFormatted: formatFCFA(payment.amount),
        method: payment.method,
        methodLabel: METHOD_LABELS[payment.method],
        status: payment.status,
        statusLabel:
          payment.status === "reussi" ? "Réussi"
          : payment.status === "en_attente" ? "En attente"
          : "Échoué",
        payerName: payment.payerName,
        phone: payment.phone,
        date: payment.date,
        dateFormatted: formatDateTime(payment.date),
      },
      invoice: linkedInvoice
        ? {
            id: linkedInvoice.id,
            number: linkedInvoice.number,
            total: linkedInvoice.total,
            totalFormatted: formatFCFA(linkedInvoice.total),
          }
        : null,
      legal: {
        law: "Loi 2013-450 + Code fiscal CI — TVA 18%",
        authority: "Direction Générale des Impôts (DGI) — Côte d'Ivoire",
        retention: "Conservation 10 ans",
      },
    });
  }

  // Cas 2 : reçu / facture
  const safeInvoice = invoice!;
  const invoicePayments = PAYMENTS.filter(
    (p) => p.invoiceId === safeInvoice.id && p.status === "reussi"
  );
  const paidAmount = invoicePayments.reduce((s, p) => s + p.amount, 0);
  const remaining = safeInvoice.total - paidAmount;

  return NextResponse.json({
    success: true,
    receiptType: "invoice",
    meta: {
      documentType: safeInvoice.status === "payee" ? "Reçu / Facture acquittée" : "Facture",
      receiptNumber: safeInvoice.number,
      generatedAt: new Date().toISOString(),
      locale: "fr-FR",
      paperSize: "A4",
    },
    tenant: {
      name: TENANT.name,
      phone: TENANT.phone,
      email: TENANT.email,
      address: TENANT.address,
      district: TENANT.district,
    },
    invoice: {
      id: safeInvoice.id,
      number: safeInvoice.number,
      patientId: safeInvoice.patientId,
      patientName: safeInvoice.patientName,
      date: safeInvoice.date,
      dateFormatted: formatDate(safeInvoice.date),
      dueDate: safeInvoice.dueDate,
      dueDateFormatted: safeInvoice.dueDate ? formatDate(safeInvoice.dueDate) : null,
      items: safeInvoice.items.map((it) => ({
        ...it,
        total: it.quantity * it.unitPrice,
        totalFormatted: formatFCFA(it.quantity * it.unitPrice),
        unitPriceFormatted: formatFCFA(it.unitPrice),
      })),
      subtotal: safeInvoice.subtotal,
      subtotalFormatted: formatFCFA(safeInvoice.subtotal),
      tax: safeInvoice.tax,
      taxFormatted: formatFCFA(safeInvoice.tax),
      taxRate: "18%",
      total: safeInvoice.total,
      totalFormatted: formatFCFA(safeInvoice.total),
      status: safeInvoice.status,
      statusLabel:
        safeInvoice.status === "payee" ? "Payée"
        : safeInvoice.status === "impayee" ? "Impayée"
        : safeInvoice.status === "partielle" ? "Partiellement payée"
        : "Annulée",
      paidAmount,
      paidAmountFormatted: formatFCFA(paidAmount),
      remaining,
      remainingFormatted: formatFCFA(remaining),
    },
    payments: invoicePayments.map((p) => ({
      id: p.id,
      reference: p.reference,
      amount: p.amount,
      amountFormatted: formatFCFA(p.amount),
      method: p.method,
      methodLabel: METHOD_LABELS[p.method],
      date: p.date,
      dateFormatted: formatDateTime(p.date),
    })),
    legal: {
      law: "Loi 2013-450 + Code fiscal CI — TVA 18%",
      authority: "Direction Générale des Impôts (DGI) — Côte d'Ivoire",
      retention: "Conservation 10 ans",
      confidentiality: "Document fiscal confidentiel",
    },
  });
}
