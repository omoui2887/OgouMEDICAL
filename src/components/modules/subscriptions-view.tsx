"use client";
import { useState } from "react";
import { SUBSCRIPTION, PLANS, TENANT } from "@/lib/mock-data";
import {
  formatFCFA, formatDate, PAYMENT_LABELS,
  type PaymentMethod, type Plan,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Crown, Check, Sparkles, CreditCard, Download, AlertTriangle,
  Users, HeartPulse, Video, MessageSquare, Calendar, Wallet,
  ShieldCheck, TrendingUp, ChevronRight, Lock,
} from "lucide-react";

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  color: string;
  short: string;
}[] = [
  { value: "orange_money", label: "Orange Money", color: "bg-orange-500", short: "OM" },
  { value: "wave", label: "Wave", color: "bg-sky-500", short: "W" },
  { value: "mtn_money", label: "MTN Money", color: "bg-yellow-400 text-yellow-950", short: "MTN" },
  { value: "card", label: "Carte bancaire", color: "bg-violet-500", short: "CB" },
];

const USAGE_STATS: {
  label: string;
  used: number;
  total: number | null;
  icon: typeof Users;
  color: string;
  bg: string;
  barColor: string;
}[] = [
  { label: "Utilisateurs", used: SUBSCRIPTION.usedSeats, total: SUBSCRIPTION.seats, icon: Users, color: "text-teal-600", bg: "bg-teal-500/10", barColor: "[&>div]:bg-teal-600" },
  { label: "Patients enregistrés", used: 48, total: null, icon: HeartPulse, color: "text-emerald-600", bg: "bg-emerald-500/10", barColor: "[&>div]:bg-emerald-600" },
  { label: "Téléconsultations", used: 12, total: 50, icon: Video, color: "text-orange-500", bg: "bg-orange-500/10", barColor: "[&>div]:bg-orange-500" },
  { label: "SMS envoyés", used: 320, total: 1000, icon: MessageSquare, color: "text-cyan-600", bg: "bg-cyan-500/10", barColor: "[&>div]:bg-cyan-500" },
];

const BILLING_HISTORY = Array.from({ length: 6 }).map((_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  d.setDate(5);
  return {
    id: `bill_${i + 1}`,
    number: `FAC-SAAS-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    date: d.toISOString(),
    amount: SUBSCRIPTION.amount,
    status: "Payée" as const,
  };
}).reverse();

export function SubscriptionsView() {
  const [planToChange, setPlanToChange] = useState<Plan | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(SUBSCRIPTION.paymentMethod ?? "orange_money");
  const [payerPhone, setPayerPhone] = useState("+225 07 08 12 34 56");
  const [cancelReason, setCancelReason] = useState("");

  const currentPlan = PLANS.find((p) => p.id === SUBSCRIPTION.plan);
  const currentPlanIndex = PLANS.findIndex((p) => p.id === SUBSCRIPTION.plan);

  function getActionLabel(plan: Plan): string {
    const idx = PLANS.findIndex((p) => p.id === plan.id);
    if (idx === currentPlanIndex) return "Plan actuel";
    if (idx > currentPlanIndex) return "Mettre à niveau";
    return "Rétrograder";
  }

  function handlePlanChange() {
    if (!planToChange) return;
    const idx = PLANS.findIndex((p) => p.id === planToChange.id);
    const action = idx > currentPlanIndex ? "Mise à niveau" : "Rétrogradation";
    toast.success(`${action} effectuée`, {
      description: `Plan ${planToChange.name} activé · ${formatFCFA(planToChange.price)}/mois via ${PAYMENT_LABELS[paymentMethod]}.`,
    });
    setPlanToChange(null);
  }

  function handlePaymentMethodChange() {
    toast.success("Méthode de paiement mise à jour", {
      description: `Les prochaines factures seront prélevées via ${PAYMENT_LABELS[paymentMethod]}.`,
    });
    setShowPaymentDialog(false);
  }

  function handleDownloadInvoice(num: string) {
    toast.success("Téléchargement du PDF", {
      description: `Facture ${num} · Génération en cours...`,
    });
  }

  function handleCancelSubscription() {
    toast.success("Résiliation demandée", {
      description: "Votre abonnement restera actif jusqu'à la fin de la période en cours. Un conseiller vous contactera.",
    });
    setShowCancelDialog(false);
    setCancelReason("");
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Abonnement & Facturation SaaS</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez votre abonnement MediSaaS CI pour {TENANT.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 px-3 py-1">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Abonnement {SUBSCRIPTION.status}
          </Badge>
        </div>
      </div>

      {/* Carte plan actuel + utilisation */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Plan actuel */}
        <Card className="relative overflow-hidden border-teal-200 dark:border-teal-900/40 lg:col-span-2">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 opacity-95" />
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 right-32 h-32 w-32 rounded-full bg-orange-400/20" />
          <div className="relative p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-teal-50">Plan actuel</p>
                <div className="mt-1 flex items-center gap-2">
                  <h3 className="text-2xl font-bold">{currentPlan?.name}</h3>
                  {currentPlan?.popular && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-semibold">
                      <Sparkles className="h-3 w-3" /> Populaire
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-teal-50">{currentPlan?.tagline}</p>
              </div>
              <Crown className="h-8 w-8 text-orange-300" />
            </div>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-4xl font-bold">{formatFCFA(SUBSCRIPTION.amount)}</span>
              <span className="mb-1 text-sm text-teal-50">/ {SUBSCRIPTION.billingCycle === "mensuel" ? "mois" : "an"}</span>
            </div>

            <Separator className="my-5 bg-white/20" />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-teal-50">Cycle de facturation</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold capitalize">
                  <Calendar className="h-3.5 w-3.5" /> {SUBSCRIPTION.billingCycle}
                </p>
              </div>
              <div>
                <p className="text-xs text-teal-50">Période en cours</p>
                <p className="mt-0.5 text-sm font-semibold">
                  {formatDate(SUBSCRIPTION.currentPeriodStart)} → {formatDate(SUBSCRIPTION.currentPeriodEnd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-teal-50">Méthode de paiement</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
                  <CreditCard className="h-3.5 w-3.5" /> {SUBSCRIPTION.paymentMethod && PAYMENT_LABELS[SUBSCRIPTION.paymentMethod]}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-white text-teal-700 hover:bg-teal-50"
                onClick={() => {
                  const entreprise = PLANS.find((p) => p.id === "entreprise");
                  if (entreprise) setPlanToChange(entreprise.id as Plan);
                  setPaymentMethod(SUBSCRIPTION.paymentMethod ?? "orange_money");
                }}
              >
                <TrendingUp className="mr-1.5 h-4 w-4" /> Améliorer mon plan
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setShowPaymentDialog(true)}
              >
                <CreditCard className="mr-1.5 h-4 w-4" /> Modifier le paiement
              </Button>
            </div>
          </div>
        </Card>

        {/* Utilisation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Utilisation du plan</CardTitle>
            <CardDescription>Consommation ce mois-ci</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {USAGE_STATS.map((stat) => {
              const pct = stat.total === null ? 35 : Math.min((stat.used / stat.total) * 100, 100);
              return (
                <div key={stat.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", stat.bg, stat.color)}>
                        <stat.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-medium">{stat.label}</span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums">
                      {stat.used}{stat.total === null ? " / illimité" : ` / ${stat.total}`}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className={cn("h-2", stat.barColor)}
                  />
                </div>
              );
            })}
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <Sparkles className="mr-1 inline h-3 w-3 text-orange-500" />
              Renouvellement le <span className="font-semibold text-foreground">{formatDate(SUBSCRIPTION.currentPeriodEnd)}</span> · {formatFCFA(SUBSCRIPTION.amount)} prélevés automatiquement.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Changer de plan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Changer de plan</h3>
            <p className="text-sm text-muted-foreground">Comparez et choisissez le plan adapté à votre cabinet.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === SUBSCRIPTION.plan;
            const actionLabel = getActionLabel(plan.id as Plan);
            const isUpgrade = PLANS.findIndex((p) => p.id === plan.id) > currentPlanIndex;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col transition-all",
                  plan.popular && !isCurrent && "border-teal-300 shadow-md dark:border-teal-800",
                  isCurrent && "border-teal-500 ring-2 ring-teal-500/30"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white hover:bg-orange-600">
                      <Sparkles className="mr-1 h-3 w-3" /> Le plus choisi
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-white", plan.color)}>
                      {plan.id === "essentiel" && <ShieldCheck className="h-5 w-5" />}
                      {plan.id === "pro" && <Crown className="h-5 w-5" />}
                      {plan.id === "entreprise" && <Sparkles className="h-5 w-5" />}
                    </div>
                    {isCurrent && (
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800">
                        <Check className="mr-1 h-3 w-3" /> Plan actuel
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-xs">{plan.tagline}</CardDescription>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-bold text-foreground">{formatFCFA(plan.price)}</span>
                    <span className="mb-1 text-xs text-muted-foreground">/ mois</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.seats} utilisateurs inclus</p>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <ul className="space-y-1.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span className={cn(f.endsWith(":") && "font-semibold text-foreground")}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-0">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="mr-1.5 h-4 w-4" /> Plan actuel
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full",
                        isUpgrade
                          ? "bg-teal-600 text-white hover:bg-teal-700"
                          : "bg-orange-500 text-white hover:bg-orange-600"
                      )}
                      onClick={() => {
                        setPlanToChange(plan.id as Plan);
                        setPaymentMethod(SUBSCRIPTION.paymentMethod ?? "orange_money");
                      }}
                    >
                      {isUpgrade ? (
                        <TrendingUp className="mr-1.5 h-4 w-4" />
                      ) : (
                        <ChevronRight className="mr-1.5 h-4 w-4" />
                      )}
                      {actionLabel}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Méthode de paiement + Historique facturation */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Méthode de paiement */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Méthode de paiement</CardTitle>
            <CardDescription>Prélèvement automatique mensuel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold", PAYMENT_OPTIONS.find((o) => o.value === SUBSCRIPTION.paymentMethod)?.color)}>
                {PAYMENT_OPTIONS.find((o) => o.value === SUBSCRIPTION.paymentMethod)?.short}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {SUBSCRIPTION.paymentMethod && PAYMENT_LABELS[SUBSCRIPTION.paymentMethod]}
                </p>
                <p className="text-xs text-muted-foreground">+225 07 08 12 34 56</p>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowPaymentDialog(true)}>
              <CreditCard className="mr-1.5 h-4 w-4" /> Modifier la méthode
            </Button>
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3 w-3 text-teal-600" />
              Paiements sécurisés via <span className="font-semibold text-foreground">CinetPay</span> · Conforme PCI-DSS.
            </div>
          </CardContent>
        </Card>

        {/* Historique de facturation */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Historique de facturation</CardTitle>
                <CardDescription>6 dernières factures d'abonnement</CardDescription>
              </div>
              <Wallet className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Facture</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-right">Montant</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                    <TableHead className="text-xs text-right">Reçu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BILLING_HISTORY.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono text-xs font-medium">{bill.number}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(bill.date)}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">{formatFCFA(bill.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 text-[11px]">
                          <Check className="mr-1 h-3 w-3" /> {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-teal-700 hover:bg-teal-50 hover:text-teal-800 dark:text-teal-300"
                          onClick={() => handleDownloadInvoice(bill.number)}
                        >
                          <Download className="mr-1 h-3.5 w-3.5" /> PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Total facturé sur 6 mois</p>
              <p className="text-sm font-bold text-teal-700 dark:text-teal-300">
                {formatFCFA(BILLING_HISTORY.reduce((s, b) => s + b.amount, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone de résiliation */}
      <Card className="border-rose-200 dark:border-rose-900/40">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Résilier l'abonnement</p>
                <p className="text-xs text-muted-foreground">
                  Votre accès sera suspendu à la fin de la période en cours. Vos données seront conservées 90 jours.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
              onClick={() => setShowCancelDialog(true)}
            >
              <AlertTriangle className="mr-1.5 h-4 w-4" /> Résilier l'abonnement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog : changement de plan */}
      <Dialog open={!!planToChange} onOpenChange={(open) => !open && setPlanToChange(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" /> Confirmer le changement de plan
            </DialogTitle>
            <DialogDescription>
              Vous passez du plan <span className="font-semibold text-foreground">{currentPlan?.name}</span> au plan <span className="font-semibold text-foreground">{planToChange?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          {planToChange && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-teal-50">Nouveau montant mensuel</p>
                    <p className="text-2xl font-bold">{formatFCFA(planToChange.price)}</p>
                  </div>
                  <Crown className="h-8 w-8 text-orange-300" />
                </div>
                <Separator className="my-3 bg-white/20" />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-teal-50">Utilisateurs inclus</p>
                    <p className="font-semibold">{planToChange.seats}</p>
                  </div>
                  <div>
                    <p className="text-teal-50">Prélèvement</p>
                    <p className="font-semibold">Dès aujourd'hui</p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Méthode de paiement</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                        paymentMethod === opt.value
                          ? "border-teal-500 ring-2 ring-teal-500/30"
                          : "border-border hover:border-teal-300"
                      )}
                    >
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-md text-white text-xs font-bold", opt.color)}>
                        {opt.short}
                      </span>
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="change-phone" className="text-sm font-medium">
                  {paymentMethod === "card" ? "Email de reçu" : "Numéro de paiement"}
                </Label>
                <Input
                  id="change-phone"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                />
              </div>

              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <Lock className="mr-1 inline h-3 w-3" />
                En confirmant, vous acceptez les conditions d'abonnement MediSaaS CI. Le prorata sera calculé automatiquement.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              className="bg-teal-600 text-white hover:bg-teal-700"
              onClick={handlePlanChange}
            >
              <Check className="mr-1.5 h-4 w-4" /> Confirmer le changement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : modification méthode de paiement */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" /> Modifier la méthode de paiement
            </DialogTitle>
            <DialogDescription>
              Choisissez le moyen qui sera utilisé pour les prochains prélèvements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Nouvelle méthode</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPaymentMethod(opt.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                      paymentMethod === opt.value
                        ? "border-teal-500 ring-2 ring-teal-500/30"
                        : "border-border hover:border-teal-300"
                    )}
                  >
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-md text-white text-xs font-bold", opt.color)}>
                      {opt.short}
                    </span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pm-phone" className="text-sm font-medium">
                {paymentMethod === "card" ? "Email de reçu" : "Numéro Mobile Money"}
              </Label>
              <Input
                id="pm-phone"
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3 w-3 text-teal-600" />
              Un code de validation sera envoyé par SMS pour confirmer le changement.
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={handlePaymentMethodChange}
            >
              <Check className="mr-1.5 h-4 w-4" /> Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : résiliation */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" /> Résilier l'abonnement
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Votre accès à MediSaaS CI sera suspendu le {formatDate(SUBSCRIPTION.currentPeriodEnd)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Ce que vous allez perdre :</p>
              <ul className="mt-2 space-y-1 text-xs text-rose-700 dark:text-rose-300">
                <li className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> Accès au tableau de bord et aux dossiers patients</li>
                <li className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> Téléconsultations et paiements Mobile Money</li>
                <li className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> SMS et notifications WhatsApp automatiques</li>
                <li className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> Support technique prioritaire</li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason" className="text-sm font-medium">
                Raison de la résiliation (optionnel)
              </Label>
              <Textarea
                id="cancel-reason"
                placeholder="Aidez-nous à améliorer notre service..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Vos données seront conservées 90 jours pour réactivation. Au-delà, elles seront définitivement supprimées (Loi 2013-450).
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Garder mon abonnement</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleCancelSubscription}
            >
              <AlertTriangle className="mr-1.5 h-4 w-4" /> Confirmer la résiliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
