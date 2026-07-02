"use client";
import { useState } from "react";
import { toast } from "sonner";
import { INVOICES, PATIENTS, TENANT, MONTHLY_REVENUE, PAYMENT_DISTRIBUTION } from "@/lib/mock-data";
import {
  formatFCFA, formatDate, PAYMENT_LABELS,
  type Invoice, type PaymentMethod,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, InvoiceStatusBadge, PaymentBadge } from "@/components/medisisaas/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Plus, Search, Filter, FileText, Wallet, Clock, TrendingUp,
  CreditCard, Printer, ArrowDownCircle, Sparkles, Trash2, Building2, User,
  CheckCircle2, Smartphone,
} from "lucide-react";

const MOBILE_MONEY_METHODS: { value: PaymentMethod; label: string; color: string; icon: string }[] = [
  { value: "orange_money", label: "Orange Money", color: "bg-orange-500", icon: "🟠" },
  { value: "wave", label: "Wave", color: "bg-sky-500", icon: "🌊" },
  { value: "mtn_money", label: "MTN Money", color: "bg-yellow-400 text-yellow-950", icon: "🟡" },
  { value: "card", label: "Carte bancaire", color: "bg-violet-500", icon: "💳" },
];

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "var(--popover-foreground)",
};

function KpiCard({
  title, value, icon: Icon, accent, sub, progress,
}: {
  title: string;
  value: string;
  icon: typeof Wallet;
  accent: string;
  sub?: string;
  progress?: number;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold tracking-tight truncate">{value}</p>
            {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", accent)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {typeof progress === "number" && (
          <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">{progress.toFixed(0)}% du total facturé</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
        <FileText className="h-7 w-7" />
      </div>
      <p className="mt-3 text-sm font-medium">Aucune facture</p>
      <p className="text-xs text-muted-foreground">Ajustez les filtres ou créez une nouvelle facture.</p>
    </div>
  );
}

function getRemaining(inv: Invoice): number {
  return Math.max(0, inv.total - (inv.paidAmount ?? 0));
}

function PaymentDialog({
  invoice, open, onOpenChange,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const remaining = invoice ? getRemaining(invoice) : 0;
  const [method, setMethod] = useState<PaymentMethod>("orange_money");
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState("");

  // Reset when invoice changes
  const effectiveAmount = amount === "" ? String(remaining) : amount;
  const amountNum = Number(effectiveAmount) || 0;

  const handleOpenChange = (v: boolean) => {
    if (v && invoice) {
      setMethod("orange_money");
      setAmount(String(remaining));
      setPhone("");
    }
    onOpenChange(v);
  };

  const handlePay = () => {
    if (!invoice) return;
    if (amountNum <= 0) {
      toast.error("Montant invalide", { description: "Saisissez un montant supérieur à 0 FCFA" });
      return;
    }
    if (method !== "card" && phone.trim() === "") {
      toast.error("Numéro requis", { description: "Saisissez le numéro Mobile Money du payeur" });
      return;
    }
    toast.success("Paiement initié", {
      description: `${formatFCFA(amountNum)} via ${PAYMENT_LABELS[method]} — Facture ${invoice.number}`,
    });
    onOpenChange(false);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-orange-500" /> Encaissement Mobile Money
          </DialogTitle>
          <DialogDescription>
            Facture {invoice.number} · {invoice.patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Récap facture */}
          <div className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-teal-50">Reste à payer</p>
                <p className="text-2xl font-bold">{formatFCFA(remaining)}</p>
              </div>
              <div className="text-right text-xs text-teal-50">
                <p>Total facture</p>
                <p className="font-semibold">{formatFCFA(invoice.total)}</p>
                <p className="mt-1">Déjà payé</p>
                <p className="font-semibold">{formatFCFA(invoice.paidAmount ?? 0)}</p>
              </div>
            </div>
          </div>

          {/* Montant à payer */}
          <div className="grid gap-2">
            <Label htmlFor="pay-amount" className="text-sm font-medium">Montant à payer (FCFA)</Label>
            <Input
              id="pay-amount"
              type="number"
              value={effectiveAmount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={remaining}
            />
            <p className="text-[11px] text-muted-foreground">Pré-rempli avec le reste à payer. Modifiable.</p>
          </div>

          {/* Choix méthode */}
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Moyen de paiement</Label>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_MONEY_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                    method === m.value
                      ? "border-teal-500 ring-2 ring-teal-500/30"
                      : "border-border hover:border-teal-300"
                  )}
                >
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-md text-white text-sm font-bold", m.color)}>
                    {m.value === "card" ? <CreditCard className="h-4 w-4" /> : m.icon}
                  </span>
                  <span className="text-xs font-medium leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Téléphone */}
          <div className="grid gap-2">
            <Label htmlFor="pay-phone" className="text-sm font-medium">
              {method === "card" ? "Email de reçu" : "Numéro Mobile Money"}
            </Label>
            <Input
              id="pay-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={method === "card" ? "patient@email.ci" : "+225 07 00 00 00 00"}
              inputMode={method === "card" ? "email" : "tel"}
            />
          </div>

          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3 text-orange-500" />
            Paiement sécurisé via <span className="font-semibold text-foreground">CinetPay</span>. Un reçu SMS sera envoyé au patient.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handlePay} className="bg-orange-500 text-white hover:bg-orange-600">
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Payer {formatFCFA(amountNum)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetailDialog({
  invoice, open, onOpenChange, onPay,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPay: (inv: Invoice) => void;
}) {
  if (!invoice) return null;
  const patient = PATIENTS.find((p) => `${p.firstName} ${p.lastName}` === invoice.patientName);
  const remaining = getRemaining(invoice);
  const canPay = invoice.status === "impayee" || invoice.status === "partielle";

  const handlePrint = () => toast.success("Impression lancée", { description: `Facture ${invoice.number} envoyée vers l'imprimante` });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" /> Facture {invoice.number}
          </DialogTitle>
          <DialogDescription>
            Émise le {formatDate(invoice.date)}{invoice.dueDate ? ` · Échéance ${formatDate(invoice.dueDate)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* En-tête émetteur + statut */}
        <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-4 dark:border-teal-900 dark:from-teal-950/40 dark:to-emerald-950/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{TENANT.name}</p>
                <p className="text-xs text-muted-foreground">{TENANT.address}</p>
                <p className="text-xs text-muted-foreground">{TENANT.phone}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Statut</p>
              <div className="mt-1"><InvoiceStatusBadge status={invoice.status} /></div>
            </div>
          </div>
        </div>

        {/* Patient */}
        <div className="rounded-lg border bg-card p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <User className="h-3 w-3" /> Patient facturé
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={invoice.patientName} color={patient?.avatarColor ?? "bg-teal-500"} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{invoice.patientName}</p>
              {patient && <p className="truncate text-[11px] text-muted-foreground">{patient.code} · {patient.commune}</p>}
            </div>
          </div>
        </div>

        {/* Prestations */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="border-b bg-muted/40 px-3 py-2">
            <p className="text-sm font-semibold">Prestations facturées</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-transparent">
                <TableHead className="h-9 text-xs">Description</TableHead>
                <TableHead className="h-9 text-xs text-center">Qté</TableHead>
                <TableHead className="h-9 text-xs text-right">Prix unitaire</TableHead>
                <TableHead className="h-9 text-xs text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((it, i) => (
                <TableRow key={i}>
                  <TableCell className="py-2 text-sm font-medium">{it.description}</TableCell>
                  <TableCell className="py-2 text-center text-sm">{it.quantity}</TableCell>
                  <TableCell className="py-2 text-right text-sm">{formatFCFA(it.unitPrice)}</TableCell>
                  <TableCell className="py-2 text-right text-sm font-semibold">{formatFCFA(it.unitPrice * it.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Récap + Paiement */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Récap */}
          <div className="rounded-lg border bg-card p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium">{formatFCFA(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA 18% (CI)</span>
              <span className="font-medium">{formatFCFA(invoice.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-teal-700 dark:text-teal-300">{formatFCFA(invoice.total)}</span>
            </div>
          </div>

          {/* Paiement */}
          <div className={cn(
            "rounded-lg border p-3 space-y-1.5 text-sm",
            invoice.status === "payee"
              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
              : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
          )}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Règlement</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Déjà payé</span>
              <span className="font-semibold text-emerald-600">{formatFCFA(invoice.paidAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reste à payer</span>
              <span className={cn("font-bold", remaining > 0 ? "text-rose-600" : "text-emerald-600")}>{formatFCFA(remaining)}</span>
            </div>
            {invoice.paymentMethod && invoice.paidAmount ? (
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">Méthode</span>
                <PaymentBadge method={invoice.paymentMethod} />
              </div>
            ) : (
              <p className="pt-1 text-xs text-muted-foreground italic">Aucun paiement enregistré</p>
            )}
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1.5 h-4 w-4" /> Imprimer la facture
          </Button>
          {canPay && (
            <Button size="sm" onClick={() => onPay(invoice)} className="bg-orange-500 text-white hover:bg-orange-600">
              <ArrowDownCircle className="mr-1.5 h-4 w-4" /> Encaisser {formatFCFA(remaining)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ItemForm {
  description: string;
  quantity: string;
  unitPrice: string;
}

function NewInvoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState<ItemForm[]>([{ description: "", quantity: "1", unitPrice: "" }]);
  const [method, setMethod] = useState<string>("orange_money");

  const reset = () => {
    setPatientId("");
    setItems([{ description: "", quantity: "1", unitPrice: "" }]);
    setMethod("orange_money");
  };

  const addItem = () => setItems([...items, { description: "", quantity: "1", unitPrice: "" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof ItemForm, value: string) => {
    setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  };

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handleSubmit = () => {
    if (!patientId) {
      toast.error("Patient manquant", { description: "Sélectionnez un patient." });
      return;
    }
    const validItems = items.filter((it) => it.description.trim() !== "" && Number(it.unitPrice) > 0);
    if (validItems.length === 0) {
      toast.error("Aucune prestation", { description: "Ajoutez au moins une ligne de prestation." });
      return;
    }
    const patient = PATIENTS.find((p) => p.id === patientId);
    toast.success("Facture créée", {
      description: `${patient?.firstName} ${patient?.lastName} · ${formatFCFA(total)} · ${PAYMENT_LABELS[method as PaymentMethod] ?? ""}`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-teal-600" /> Nouvelle facture
          </DialogTitle>
          <DialogDescription>
            Créer une facture pour un patient de la Clinique du Plateau.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="inv-patient">Patient *</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger id="inv-patient" className="w-full">
                  <SelectValue placeholder="Sélectionner un patient" />
                </SelectTrigger>
                <SelectContent>
                  <div className="max-h-60 overflow-y-auto">
                    {PATIENTS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} <span className="text-muted-foreground">· {p.code}</span>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inv-method">Méthode de paiement</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="inv-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="mtn_money">MTN Money</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-orange-500" /> Prestations
              </Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-7 border-teal-200 text-teal-700 hover:bg-teal-50">
                <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter une ligne
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="rounded-lg border bg-card p-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">Ligne {i + 1}</span>
                    {items.length > 1 && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(i)} className="h-7 px-2 text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_80px_140px]">
                    <Input placeholder="Description de la prestation" value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                    <Input type="number" min={1} placeholder="Qté" value={it.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} />
                    <Input type="number" min={0} placeholder="Prix unitaire" value={it.unitPrice} onChange={(e) => updateItem(i, "unitPrice", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Récap */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium">{formatFCFA(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA 18% (Côte d&apos;Ivoire)</span>
              <span className="font-medium">{formatFCFA(tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-teal-700 dark:text-teal-300">{formatFCFA(total)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleSubmit} className="bg-teal-600 text-white hover:bg-teal-700">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Créer la facture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BillingView() {
  const [tab, setTab] = useState<"toutes" | "impayees" | "payees" | "partielles">("toutes");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("tous");
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  // KPIs
  const totalBilled = INVOICES.filter((i) => i.status !== "annulee").reduce((s, i) => s + i.total, 0);
  const totalCollected = INVOICES
    .filter((i) => i.status === "payee" || i.status === "partielle")
    .reduce((s, i) => s + (i.paidAmount ?? 0), 0);
  const unpaidAmount = INVOICES.filter((i) => i.status === "impayee").reduce((s, i) => s + i.total, 0);
  const partialCount = INVOICES.filter((i) => i.status === "partielle").length;
  const partialAmount = INVOICES.filter((i) => i.status === "partielle").reduce((s, i) => s + getRemaining(i), 0);
  const recoveryRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

  // Filtering
  const filtered = INVOICES.filter((inv) => {
    if (tab === "impayees" && inv.status !== "impayee") return false;
    if (tab === "payees" && inv.status !== "payee") return false;
    if (tab === "partielles" && inv.status !== "partielle") return false;
    if (methodFilter !== "tous" && inv.paymentMethod !== methodFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!inv.number.toLowerCase().includes(q) && !inv.patientName.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openDetail = (inv: Invoice) => {
    setDetail(inv);
    setDetailOpen(true);
  };

  const handlePay = (inv: Invoice) => {
    setPayInvoice(inv);
    setPayOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturation &amp; Paiements</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-emerald-600">{formatFCFA(totalCollected)}</span> encaissés · Mobile Money (Orange, Wave, MTN), CB &amp; espèces
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="bg-teal-600 text-white hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle facture
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Revenus encaissés"
          value={formatFCFA(totalCollected)}
          icon={Wallet}
          accent="bg-emerald-600"
          sub={`${INVOICES.filter((i) => i.status === "payee").length} factures payées`}
          progress={recoveryRate}
        />
        <KpiCard
          title="Factures impayées"
          value={formatFCFA(unpaidAmount)}
          icon={Clock}
          accent="bg-rose-500"
          sub={`${INVOICES.filter((i) => i.status === "impayee").length} factures à recouvrer`}
        />
        <KpiCard
          title="Partielles"
          value={formatFCFA(partialAmount)}
          icon={TrendingUp}
          accent="bg-amber-500"
          sub={`${partialCount} factures à solde`}
        />
        <KpiCard
          title="Taux de recouvrement"
          value={`${recoveryRate.toFixed(1)}%`}
          icon={CheckCircle2}
          accent="bg-teal-600"
          sub="Sur total facturé non annulé"
        />
      </div>

      {/* Onglets + Filtres + Tableau */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="toutes">Toutes</TabsTrigger>
              <TabsTrigger value="impayees">Impayées</TabsTrigger>
              <TabsTrigger value="payees">Payées</TabsTrigger>
              <TabsTrigger value="partielles">Partielles</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou patient…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger size="sm" className="w-[200px]">
                  <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les méthodes</SelectItem>
                  <SelectItem value="orange_money">Orange Money</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="mtn_money">MTN Money</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  <TableRow>
                    <TableHead className="text-xs">N° facture</TableHead>
                    <TableHead className="text-xs">Patient</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs text-right hidden md:table-cell">Payé</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Méthode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => {
                    const patient = PATIENTS.find((p) => `${p.firstName} ${p.lastName}` === inv.patientName);
                    return (
                      <TableRow
                        key={inv.id}
                        className="cursor-pointer transition-colors hover:bg-teal-50/60 dark:hover:bg-teal-950/20"
                        onClick={() => openDetail(inv)}
                      >
                        <TableCell className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-300">
                          {inv.number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar name={inv.patientName} color={patient?.avatarColor ?? "bg-teal-500"} size="sm" />
                            <span className="text-sm font-medium">{inv.patientName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(inv.date)}</TableCell>
                        <TableCell className="text-right text-sm font-bold">{formatFCFA(inv.total)}</TableCell>
                        <TableCell className="hidden md:table-cell text-right text-sm text-emerald-600 font-medium">
                          {inv.paidAmount ? formatFCFA(inv.paidAmount) : "—"}
                        </TableCell>
                        <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {inv.paymentMethod && inv.paidAmount ? <PaymentBadge method={inv.paymentMethod} /> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graphiques */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-600" /> Revenus mensuels
            </CardTitle>
            <CardDescription>12 derniers mois · en FCFA</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={MONTHLY_REVENUE}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v / 1000000}M`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [formatFCFA(v), "Revenus"]}
                  cursor={{ fill: "var(--accent)", opacity: 0.3 }}
                />
                <Bar dataKey="revenue" name="Revenus" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-500" /> Répartition des paiements
            </CardTitle>
            <CardDescription>Mobile Money domine en CI</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={PAYMENT_DISTRIBUTION}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={3}
                >
                  {PAYMENT_DISTRIBUTION.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {PAYMENT_DISTRIBUTION.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-muted-foreground">{p.name}</span>
                  </div>
                  <span className="font-semibold">{p.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <InvoiceDetailDialog
        invoice={detail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onPay={handlePay}
      />
      <PaymentDialog invoice={payInvoice} open={payOpen} onOpenChange={setPayOpen} />
      <NewInvoiceDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
