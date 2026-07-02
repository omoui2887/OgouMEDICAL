"use client";
import { useState } from "react";
import {
  PATIENTS, APPOINTMENTS, PRESCRIPTIONS, INVOICES, DOCTORS, TENANT,
} from "@/lib/mock-data";
import {
  formatFCFA, formatDate, formatDateTime, PAYMENT_LABELS,
  type PaymentMethod, type Prescription, type Invoice,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Avatar, AppointmentStatusBadge, InvoiceStatusBadge, PaymentBadge,
} from "@/components/medisisaas/shared";
import {
  Heart, Droplet, Activity, CalendarClock, Video, Pill, FileText,
  XCircle, RefreshCw, PlusCircle, Phone, ShieldCheck, MapPin,
  Stethoscope, Scale, Ruler, Clock, CreditCard, AlertTriangle,
  CheckCircle2, Sparkles, Send,
} from "lucide-react";

const MOBILE_MONEY_METHODS: {
  value: PaymentMethod;
  label: string;
  color: string;
}[] = [
  { value: "orange_money", label: "Orange Money", color: "bg-orange-500" },
  { value: "wave", label: "Wave", color: "bg-sky-500" },
  { value: "mtn_money", label: "MTN Money", color: "bg-yellow-400 text-yellow-950" },
  { value: "card", label: "Carte bancaire", color: "bg-violet-500" },
];

export function PatientPortalView() {
  const me = PATIENTS[0];
  const myAppointments = APPOINTMENTS.filter((a) => a.patientId === me.id);
  const myPrescriptions = PRESCRIPTIONS.filter((p) => p.patientId === me.id);
  const myInvoices = INVOICES.filter((i) => i.patientId === me.id);

  const now = Date.now();
  const upcomingTeleconsult = myAppointments.find(
    (a) =>
      a.type === "teleconsultation"
      && new Date(a.date).getTime() > now
      && a.status !== "annule"
      && a.status !== "termine"
  );
  const nextAppointment = [...myAppointments]
    .filter((a) => new Date(a.date).getTime() > now && a.status !== "annule")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("orange_money");
  const [payerPhone, setPayerPhone] = useState(me.phone);

  // Prendre RDV
  const [rdvSpecialty, setRdvSpecialty] = useState("");
  const [rdvDoctor, setRdvDoctor] = useState("");
  const [rdvDate, setRdvDate] = useState("");
  const [rdvTime, setRdvTime] = useState("");
  const [rdvReason, setRdvReason] = useState("");

  const imc =
    me.weight && me.height
      ? me.weight / Math.pow(me.height / 100, 2)
      : null;
  const imcCategory =
    imc === null
      ? null
      : imc < 18.5
        ? { label: "Insuffisance pondérale", color: "text-amber-600", bg: "bg-amber-500/10" }
        : imc < 25
          ? { label: "Poids normal", color: "text-emerald-600", bg: "bg-emerald-500/10" }
          : imc < 30
            ? { label: "Surpoids", color: "text-orange-600", bg: "bg-orange-500/10" }
            : { label: "Obésité", color: "text-rose-600", bg: "bg-rose-500/10" };

  const age = me.birthDate
    ? Math.floor((Date.now() - new Date(me.birthDate).getTime()) / (365.25 * 86400000))
    : null;

  const specialties = Array.from(new Set(DOCTORS.map((d) => d.specialty)));
  const doctorsForSpecialty = rdvSpecialty
    ? DOCTORS.filter((d) => d.specialty === rdvSpecialty)
    : DOCTORS;

  function handleCancelAppointment() {
    toast.success("Rendez-vous annulé", {
      description: `Le cabinet ${TENANT.name} a été notifié. Un accusé de réception a été envoyé au ${me.phone}.`,
    });
  }
  function handleRenewPrescription(rx: Prescription) {
    toast.success("Demande de renouvellement envoyée", {
      description: `Ordonnance ${rx.number} · ${rx.doctorName} vous répondra sous 48h.`,
    });
  }
  function handlePayInvoice() {
    if (!invoiceToPay) return;
    toast.success("Paiement effectué", {
      description: `${formatFCFA(invoiceToPay.total)} via ${PAYMENT_LABELS[paymentMethod]}. Reçu envoyé par SMS au ${payerPhone}.`,
    });
    setInvoiceToPay(null);
  }
  function handleNewAppointment() {
    if (!rdvSpecialty || !rdvDoctor || !rdvDate || !rdvTime) {
      toast.error("Champs obligatoires manquants", {
        description: "Veuillez choisir une spécialité, un médecin, une date et une heure.",
      });
      return;
    }
    const doctor = DOCTORS.find((d) => d.id === rdvDoctor);
    toast.success("Demande de rendez-vous envoyée", {
      description: `${doctor?.name} · ${rdvDate} à ${rdvTime}. Vous recevrez une confirmation par SMS.`,
    });
    setRdvSpecialty("");
    setRdvDoctor("");
    setRdvDate("");
    setRdvTime("");
    setRdvReason("");
  }
  function handleJoinTeleconsult() {
    toast.info("Connexion à Daily.co...", {
      description: "La salle de téléconsultation s'ouvre dans un nouvel onglet.",
    });
  }

  return (
    <div className="space-y-6">
      {/* En-tête : Bonjour + carte patient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 p-6 text-white shadow-xl shadow-teal-600/20">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-28 h-36 w-36 rounded-full bg-orange-400/20" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-50">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">Bonjour, {me.firstName} 👋</h2>
            <p className="mt-1 text-sm text-teal-50">
              Bienvenue dans votre espace santé · {TENANT.name}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3 backdrop-blur-sm ring-1 ring-white/20">
            <Avatar name={`${me.firstName} ${me.lastName}`} color={me.avatarColor} size="lg" />
            <div className="text-sm">
              <p className="font-semibold">{me.firstName} {me.lastName}</p>
              <p className="text-teal-50/90 text-xs">Code patient : <span className="font-mono font-semibold">{me.code}</span></p>
              <p className="text-teal-50/90 text-[11px]">
                {me.gender === "F" ? "Femme" : "Homme"}{age !== null && ` · ${age} ans`} · {me.commune}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/30 px-2 py-0.5 text-[11px] font-semibold">
                  <Droplet className="h-3 w-3" /> Groupe {me.bloodType}
                </span>
                {me.insuranceProvider && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                    <ShieldCheck className="h-3 w-3" /> {me.insuranceProvider}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carte "Mon dossier" médical */}
      <Card className="border-teal-200/60 dark:border-teal-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Heart className="h-5 w-5" /> Mon dossier médical
              </CardTitle>
              <CardDescription>Résumé de votre santé suivi par {TENANT.name}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="mr-1 h-3 w-3" /> À jour
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Groupe sanguin */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Droplet className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Groupe sanguin</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-300">{me.bloodType ?? "—"}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Carte de donneur disponible</p>
            </div>

            {/* Allergies */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Allergies</span>
              </div>
              {me.allergies.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {me.allergies.map((a) => (
                    <Badge key={a} variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800">
                      {a}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Aucune allergie connue</p>
              )}
            </div>

            {/* Antécédents */}
            <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/40 dark:bg-orange-950/20">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Antécédents</span>
              </div>
              {me.chronicConditions.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {me.chronicConditions.map((c) => (
                    <Badge key={c} variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800">
                      {c}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Aucun antécédent</p>
              )}
            </div>

            {/* Poids / Taille / IMC */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Scale className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Mesures</span>
              </div>
              <div className="mt-2 flex items-end gap-3">
                <div>
                  <p className="text-lg font-bold text-teal-700 dark:text-teal-300">{me.weight ?? "—"} kg</p>
                  <p className="text-[11px] text-muted-foreground">Poids</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div>
                  <p className="text-lg font-bold text-teal-700 dark:text-teal-300">{me.height ?? "—"} cm</p>
                  <p className="text-[11px] text-muted-foreground">Taille</p>
                </div>
              </div>
              {imc !== null && imcCategory && (
                <div className={cn("mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold", imcCategory.bg, imcCategory.color)}>
                  <Ruler className="h-3 w-3" /> IMC {imc.toFixed(1)} · {imcCategory.label}
                </div>
              )}
            </div>
          </div>

          {/* Prochain RDV */}
          {nextAppointment && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Prochain rendez-vous</p>
                  <p className="text-xs text-muted-foreground">
                    {nextAppointment.doctorName} · {nextAppointment.specialty}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-teal-700 dark:text-teal-300">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {formatDateTime(nextAppointment.date)} · {nextAppointment.reason}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {nextAppointment.type === "teleconsultation" && (
                  <Button size="sm" variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50" onClick={handleJoinTeleconsult}>
                    <Video className="mr-1.5 h-4 w-4" /> Rejoindre
                  </Button>
                )}
                <AppointmentStatusBadge status={nextAppointment.status} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encart téléconsultation */}
      {upcomingTeleconsult && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white shadow-lg shadow-orange-500/20">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15" />
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-50">Téléconsultation à venir</p>
                <p className="text-lg font-bold">{upcomingTeleconsult.doctorName}</p>
                <p className="text-xs text-orange-50">
                  {formatDateTime(upcomingTeleconsult.date)} · Salle vidéo prête 15 min avant
                </p>
              </div>
            </div>
            <Button onClick={handleJoinTeleconsult} className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-md">
              <Video className="mr-2 h-4 w-4" /> Rejoindre la téléconsultation
            </Button>
          </div>
        </div>
      )}

      {/* Onglets */}
      <Tabs defaultValue="rdv" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="rdv" className="py-2">
            <CalendarClock className="mr-1.5 h-4 w-4" /> Mes rendez-vous
          </TabsTrigger>
          <TabsTrigger value="ordonnances" className="py-2">
            <Pill className="mr-1.5 h-4 w-4" /> Mes ordonnances
          </TabsTrigger>
          <TabsTrigger value="factures" className="py-2">
            <FileText className="mr-1.5 h-4 w-4" /> Mes factures
          </TabsTrigger>
          <TabsTrigger value="prendre-rdv" className="py-2">
            <PlusCircle className="mr-1.5 h-4 w-4" /> Prendre RDV
          </TabsTrigger>
        </TabsList>

        {/* Mes rendez-vous */}
        <TabsContent value="rdv" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mes rendez-vous</CardTitle>
              <CardDescription>
                {myAppointments.length} rendez-vous · {myAppointments.filter((a) => a.status === "planifie" || a.status === "confirme").length} à venir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {myAppointments.length === 0 && (
                <EmptyState
                  icon={CalendarClock}
                  title="Aucun rendez-vous"
                  description="Vous n'avez pas encore de rendez-vous planifié."
                />
              )}
              {myAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl text-white",
                        apt.type === "teleconsultation" ? "bg-orange-500" : "bg-teal-600"
                      )}
                    >
                      {apt.type === "teleconsultation" ? <Video className="h-5 w-5" /> : <Stethoscope className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{apt.doctorName}</p>
                        <Badge variant="outline" className="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800 text-[11px]">
                          {apt.specialty}
                        </Badge>
                        {apt.type === "teleconsultation" && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800 text-[11px]">
                            <Video className="mr-1 h-3 w-3" /> Téléconsultation
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{apt.reason}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-teal-700 dark:text-teal-300">
                        <Clock className="h-3 w-3" /> {formatDateTime(apt.date)} · {apt.duration} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AppointmentStatusBadge status={apt.status} />
                    {(apt.status === "planifie" || apt.status === "confirme") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                        onClick={() => handleCancelAppointment()}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" /> Annuler
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mes ordonnances */}
        <TabsContent value="ordonnances" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mes ordonnances</CardTitle>
              <CardDescription>
                {myPrescriptions.length} ordonnance(s) · {myPrescriptions.filter((p) => p.status === "active").length} active(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {myPrescriptions.length === 0 && (
                <EmptyState
                  icon={Pill}
                  title="Aucune ordonnance"
                  description="Vos ordonnances électroniques apparaîtront ici."
                />
              )}
              {myPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{rx.number}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px]",
                            rx.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700"
                          )}
                        >
                          {rx.status === "active" ? "Active" : "Expirée"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Prescrite par {rx.doctorName} · {formatDate(rx.date)}
                      </p>
                      <p className="mt-0.5 text-xs">
                        <span className="text-muted-foreground">{rx.medications.length} médicament(s) :</span>{" "}
                        <span className="font-medium">{rx.medications.map((m) => m.name).join(", ")}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedRx(rx)}>
                      <FileText className="mr-1 h-3.5 w-3.5" /> Voir détail
                    </Button>
                    {rx.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
                        onClick={() => handleRenewPrescription(rx)}
                      >
                        <RefreshCw className="mr-1 h-3.5 w-3.5" /> Renouveler
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mes factures */}
        <TabsContent value="factures" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mes factures</CardTitle>
              <CardDescription>
                {myInvoices.length} facture(s) ·{" "}
                {myInvoices.filter((i) => i.status === "impayee").length} impayée(s) ·{" "}
                {myInvoices.filter((i) => i.status === "payee").length} payée(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {myInvoices.length === 0 && (
                <EmptyState
                  icon={FileText}
                  title="Aucune facture"
                  description="Vos factures de consultation apparaîtront ici."
                />
              )}
              {myInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{inv.number}</p>
                        <InvoiceStatusBadge status={inv.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Émise le {formatDate(inv.date)}
                        {inv.dueDate && ` · Échéance ${formatDate(inv.dueDate)}`}
                      </p>
                      <p className="mt-0.5 text-xs">
                        <span className="text-muted-foreground">{inv.items.length} prestation(s) :</span>{" "}
                        <span className="font-medium">{inv.items.map((it) => it.description).join(", ")}</span>
                      </p>
                      {inv.paymentMethod && inv.status === "payee" && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs">
                          <PaymentBadge method={inv.paymentMethod} />
                          <span className="text-muted-foreground">Payé le {formatDate(inv.date)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Montant total</p>
                      <p className="text-lg font-bold text-teal-700 dark:text-teal-300">{formatFCFA(inv.total)}</p>
                      {inv.status === "partielle" && inv.paidAmount && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                          Payé {formatFCFA(inv.paidAmount)} · Reste {formatFCFA(inv.total - inv.paidAmount)}
                        </p>
                      )}
                    </div>
                    {(inv.status === "impayee" || inv.status === "partielle") && (
                      <Button
                        size="sm"
                        className="bg-orange-500 text-white hover:bg-orange-600"
                        onClick={() => {
                          setInvoiceToPay(inv);
                          setPaymentMethod("orange_money");
                          setPayerPhone(me.phone);
                        }}
                      >
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Payer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prendre RDV */}
        <TabsContent value="prendre-rdv" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <PlusCircle className="h-4 w-4 text-teal-600" /> Prendre un rendez-vous
              </CardTitle>
              <CardDescription>
                Choisissez une spécialité et un médecin. Votre demande sera confirmée par SMS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Spécialité */}
                <div className="space-y-1.5">
                  <Label htmlFor="rdv-specialty" className="text-sm font-medium">Spécialité médicale *</Label>
                  <Select
                    value={rdvSpecialty}
                    onValueChange={(v) => {
                      setRdvSpecialty(v);
                      setRdvDoctor("");
                    }}
                  >
                    <SelectTrigger id="rdv-specialty" className="w-full">
                      <SelectValue placeholder="Choisir une spécialité..." />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Médecin */}
                <div className="space-y-1.5">
                  <Label htmlFor="rdv-doctor" className="text-sm font-medium">Médecin *</Label>
                  <Select value={rdvDoctor} onValueChange={setRdvDoctor}>
                    <SelectTrigger id="rdv-doctor" className="w-full">
                      <SelectValue placeholder={rdvSpecialty ? "Choisir un médecin..." : "Sélectionnez d'abord une spécialité"} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorsForSpecialty.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} · {d.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="rdv-date" className="text-sm font-medium">Date souhaitée *</Label>
                  <Input
                    id="rdv-date"
                    type="date"
                    value={rdvDate}
                    onChange={(e) => setRdvDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Heure */}
                <div className="space-y-1.5">
                  <Label htmlFor="rdv-time" className="text-sm font-medium">Heure souhaitée *</Label>
                  <Input
                    id="rdv-time"
                    type="time"
                    value={rdvTime}
                    onChange={(e) => setRdvTime(e.target.value)}
                  />
                </div>

                {/* Motif */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="rdv-reason" className="text-sm font-medium">Motif de la consultation</Label>
                  <Textarea
                    id="rdv-reason"
                    placeholder="Décrivez brièvement vos symptômes ou le motif de votre visite..."
                    value={rdvReason}
                    onChange={(e) => setRdvReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Médecin sélectionné - aperçu */}
              {rdvDoctor && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-teal-50 p-3 dark:bg-teal-950/30">
                  {(() => {
                    const doc = DOCTORS.find((d) => d.id === rdvDoctor);
                    if (!doc) return null;
                    return (
                      <>
                        <Avatar name={doc.name} color={doc.avatarColor} size="md" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.specialty} · ⭐ {doc.rating} · {doc.patientsCount} patients suivis
                          </p>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-[11px] text-muted-foreground">Téléphone cabinet</p>
                          <p className="text-xs font-medium">{doc.phone}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Infos pratiques */}
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <InfoChip icon={MapPin} label="Commune" value={me.commune} />
                <InfoChip icon={Phone} label="Téléphone" value={me.phone} />
                <InfoChip icon={ShieldCheck} label="Assurance" value={me.insuranceProvider ?? "Non couvert"} />
              </div>

              <Separator className="my-4" />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => {
                  setRdvSpecialty(""); setRdvDoctor(""); setRdvDate(""); setRdvTime(""); setRdvReason("");
                }}>
                  Réinitialiser
                </Button>
                <Button
                  className="bg-teal-600 text-white hover:bg-teal-700"
                  onClick={handleNewAppointment}
                >
                  <Send className="mr-2 h-4 w-4" /> Confirmer la demande
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog : détail ordonnance */}
      <Dialog open={!!selectedRx} onOpenChange={(open) => !open && setSelectedRx(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-orange-500" /> Ordonnance {selectedRx?.number}
            </DialogTitle>
            <DialogDescription>
              Prescrite par {selectedRx?.doctorName} · {selectedRx && formatDate(selectedRx.date)}
            </DialogDescription>
          </DialogHeader>
          {selectedRx && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1",
                      selectedRx.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700"
                    )}
                  >
                    {selectedRx.status === "active" ? "Active" : "Expirée"}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Validité</p>
                  <p className="text-sm font-semibold">{selectedRx.validityDays} jours</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Médicaments prescrits</p>
                <div className="space-y-2">
                  {selectedRx.medications.map((m, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">{m.name}</p>
                      <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <span><span className="font-medium text-foreground">Posologie :</span> {m.dosage}</span>
                        <span><span className="font-medium text-foreground">Fréquence :</span> {m.frequency}</span>
                        <span><span className="font-medium text-foreground">Durée :</span> {m.duration}</span>
                      </div>
                      {m.instructions && (
                        <p className="mt-1.5 text-xs text-orange-600 dark:text-orange-400">
                          ⚠ {m.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedRx.notes && (
                <div className="rounded-lg bg-orange-50 p-3 text-xs text-orange-800 dark:bg-orange-950/30 dark:text-orange-200">
                  <span className="font-semibold">Note du médecin : </span>{selectedRx.notes}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedRx?.status === "active" && (
              <Button
                variant="outline"
                className="border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300"
                onClick={() => {
                  handleRenewPrescription(selectedRx);
                  setSelectedRx(null);
                }}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" /> Demander renouvellement
              </Button>
            )}
            <DialogClose asChild>
              <Button>Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : paiement facture */}
      <Dialog open={!!invoiceToPay} onOpenChange={(open) => !open && setInvoiceToPay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" /> Payer la facture
            </DialogTitle>
            <DialogDescription>
              Facture {invoiceToPay?.number} · {invoiceToPay && formatDate(invoiceToPay.date)}
            </DialogDescription>
          </DialogHeader>
          {invoiceToPay && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white">
                <p className="text-xs text-teal-50">Montant à régler</p>
                <p className="text-2xl font-bold">{formatFCFA(invoiceToPay.total)}</p>
                <p className="mt-1 text-xs text-teal-50">
                  Sous-total {formatFCFA(invoiceToPay.subtotal)} · TVA 18% {formatFCFA(invoiceToPay.tax)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Moyen de paiement</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MOBILE_MONEY_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                        paymentMethod === m.value
                          ? "border-teal-500 ring-2 ring-teal-500/30"
                          : "border-border hover:border-teal-300"
                      )}
                    >
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-md text-white", m.color)}>
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payer-phone" className="text-sm font-medium">
                  {paymentMethod === "card" ? "Email de reçu" : "Numéro Mobile Money"}
                </Label>
                <Input
                  id="payer-phone"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder={paymentMethod === "card" ? "votre@email.ci" : "+225 07 ..."}
                />
              </div>

              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <Sparkles className="mr-1 inline h-3 w-3 text-orange-500" />
                Paiement sécurisé via <span className="font-semibold text-foreground">CinetPay</span>. Vous recevrez un reçu par SMS.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={handlePayInvoice}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {invoiceToPay && `Payer ${formatFCFA(invoiceToPay.total)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({
  icon: Icon, title, description,
}: {
  icon: typeof Heart;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function InfoChip({
  icon: Icon, label, value,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
      <Icon className="h-4 w-4 shrink-0 text-teal-600" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-medium">{value}</p>
      </div>
    </div>
  );
}
