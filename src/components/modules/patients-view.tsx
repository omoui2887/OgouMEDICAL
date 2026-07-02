"use client";
import { useState } from "react";
import { toast } from "sonner";
import { PATIENTS, APPOINTMENTS, PRESCRIPTIONS, INVOICES } from "@/lib/mock-data";
import { formatFCFA, formatDate, type Patient } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AppointmentStatusBadge, InvoiceStatusBadge } from "@/components/medisisaas/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Search, UserPlus, Users, Phone, MapPin, Droplet, Shield,
  Activity, FileText, Receipt, AlertTriangle, HeartPulse,
  Ruler, Weight, Calendar, Mail, ChevronRight, Stethoscope,
} from "lucide-react";

type Gender = "M" | "F";

const COMMUNES = ["Cocody", "Plateau", "Yopougon", "Marcory", "Treichville", "Adjamé", "Abobo", "Koumassi", "Port-Bouët", "Attécoubé"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function calcAge(birth: string): number {
  const b = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function calcBMI(weight?: number, height?: number): number | null {
  if (!weight || !height) return null;
  const m = height / 100;
  return Math.round((weight / (m * m)) * 10) / 10;
}

function bmiCategory(bmi: number | null): { label: string; accent: string } | null {
  if (bmi === null) return null;
  if (bmi < 18.5) return { label: "Insuffisant", accent: "bg-amber-500/10 text-amber-600" };
  if (bmi < 25) return { label: "Normal", accent: "bg-emerald-500/10 text-emerald-600" };
  if (bmi < 30) return { label: "Surpoids", accent: "bg-orange-500/10 text-orange-600" };
  return { label: "Obésité", accent: "bg-rose-500/10 text-rose-600" };
}

function PatientStatusBadge({ status }: { status: "actif" | "inactif" }) {
  if (status === "actif") {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">Actif</Badge>;
  }
  return <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:text-zinc-400">Inactif</Badge>;
}

function BloodTypeBadge({ type }: { type?: string }) {
  if (!type) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Badge variant="outline" className="gap-1 border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
      <Droplet className="h-3 w-3" /> {type}
    </Badge>
  );
}

interface NewPatientForm {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  commune: string;
  bloodType: string;
}

function NewPatientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState<NewPatientForm>({
    firstName: "",
    lastName: "",
    gender: "M",
    birthDate: "1990-01-01",
    phone: "+225 ",
    commune: "Cocody",
    bloodType: "O+",
  });

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error("Champs manquants", { description: "Prénom, nom et téléphone sont obligatoires." });
      return;
    }
    toast.success("Patient enregistré", {
      description: `${form.firstName} ${form.lastName} · ${form.commune} · Dossier créé dans le DPN`,
    });
    setForm({ firstName: "", lastName: "", gender: "M", birthDate: "1990-01-01", phone: "+225 ", commune: "Cocody", bloodType: "O+" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-600" /> Nouveau patient
          </DialogTitle>
          <DialogDescription>
            Créer un dossier patient numérique (DPN) conforme à la Loi 2013-450.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="np-first">Prénom *</Label>
              <Input id="np-first" placeholder="Ex. Aya" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="np-last">Nom *</Label>
              <Input id="np-last" placeholder="Ex. Kouassi" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Genre</Label>
              <RadioGroup
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: v as Gender })}
                className="grid grid-cols-2 gap-3"
              >
                <Label className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors", form.gender === "M" ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30" : "border-border hover:bg-accent")}>
                  <RadioGroupItem value="M" /> Masculin
                </Label>
                <Label className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors", form.gender === "F" ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30" : "border-border hover:bg-accent")}>
                  <RadioGroupItem value="F" /> Féminin
                </Label>
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="np-birth">Date de naissance</Label>
              <Input id="np-birth" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="np-phone">Téléphone *</Label>
            <Input id="np-phone" placeholder="+225 07 XX XX XX XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Commune</Label>
              <Select value={form.commune} onValueChange={(v) => setForm({ ...form, commune: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMMUNES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Groupe sanguin</Label>
              <Select value={form.bloodType} onValueChange={(v) => setForm({ ...form, bloodType: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Annuler</Button></DialogClose>
          <Button onClick={handleSubmit} className="bg-teal-600 text-white hover:bg-teal-700">
            <UserPlus className="mr-2 h-4 w-4" /> Enregistrer le patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value, accent }: { icon: typeof Phone; label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", accent ?? "bg-teal-500/10 text-teal-600")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value || <span className="text-muted-foreground">Non renseigné</span>}</p>
      </div>
    </div>
  );
}

function PatientDetailSheet({ patient, open, onOpenChange }: { patient: Patient | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!patient) return null;
  const age = calcAge(patient.birthDate);
  const bmi = calcBMI(patient.weight, patient.height);
  const bmiCat = bmiCategory(bmi);
  const patientAppointments = APPOINTMENTS
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const patientPrescriptions = PRESCRIPTIONS
    .filter((p) => p.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const patientInvoices = INVOICES
    .filter((i) => i.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-start gap-4">
            <Avatar name={`${patient.firstName} ${patient.lastName}`} color={patient.avatarColor} size="lg" />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl">{patient.firstName} {patient.lastName}</SheetTitle>
              <SheetDescription className="mt-0.5">
                <span className="font-mono text-teal-600">{patient.code}</span> · {patient.gender === "M" ? "Homme" : "Femme"} · {age} ans
              </SheetDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <BloodTypeBadge type={patient.bloodType} />
                {patient.insuranceProvider && (
                  <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Shield className="h-3 w-3" /> {patient.insuranceProvider}
                  </Badge>
                )}
                <PatientStatusBadge status={patient.status} />
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {/* Démographie */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-teal-600" /> Informations démographiques
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow icon={Calendar} label="Naissance" value={`${formatDate(patient.birthDate)} (${age} ans)`} />
              <InfoRow icon={Users} label="Genre" value={patient.gender === "M" ? "Masculin" : "Féminin"} accent="bg-violet-500/10 text-violet-600" />
              <InfoRow icon={Phone} label="Téléphone" value={patient.phone} accent="bg-orange-500/10 text-orange-600" />
              <InfoRow icon={Mail} label="Email" value={patient.email} accent="bg-cyan-500/10 text-cyan-600" />
              <InfoRow icon={MapPin} label="Adresse" value={patient.address} accent="bg-emerald-500/10 text-emerald-600" />
              <InfoRow icon={MapPin} label="Commune" value={patient.commune} accent="bg-emerald-500/10 text-emerald-600" />
            </div>
          </section>

          <Separator />

          {/* Données médicales */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <HeartPulse className="h-4 w-4 text-rose-500" /> Données médicales
            </h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <InfoRow icon={Weight} label="Poids" value={patient.weight ? `${patient.weight} kg` : undefined} accent="bg-amber-500/10 text-amber-600" />
              <InfoRow icon={Ruler} label="Taille" value={patient.height ? `${patient.height} cm` : undefined} accent="bg-cyan-500/10 text-cyan-600" />
              <InfoRow icon={Activity} label="IMC" value={bmi ? `${bmi} (${bmiCat?.label})` : undefined} accent={bmiCat?.accent ?? "bg-teal-500/10 text-teal-600"} />
            </div>

            {/* Allergies */}
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900 dark:bg-rose-950/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Allergies</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {patient.allergies.length > 0 ? (
                  patient.allergies.map((a) => (
                    <Badge key={a} className="bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300">
                      {a}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Aucune allergie connue</span>
                )}
              </div>
            </div>

            {/* Antécédents chroniques */}
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Antécédents chroniques</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {patient.chronicConditions.length > 0 ? (
                  patient.chronicConditions.map((c) => (
                    <Badge key={c} className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300">
                      {c}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Aucun antécédent chronique</span>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Assurance */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-emerald-600" /> Couverture sanitaire
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <InfoRow icon={Shield} label="Organisme" value={patient.insuranceProvider} accent="bg-emerald-500/10 text-emerald-600" />
              <InfoRow icon={FileText} label="Numéro police" value={patient.insuranceNumber} accent="bg-emerald-500/10 text-emerald-600" />
            </div>
          </section>

          <Separator />

          {/* Historique RDV */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-teal-600" /> Historique des rendez-vous
              <Badge variant="secondary" className="ml-auto">{patientAppointments.length}</Badge>
            </h3>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {patientAppointments.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Aucun rendez-vous</p>
              ) : (
                patientAppointments.slice(0, 8).map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <div className="flex h-9 w-12 flex-col items-center justify-center rounded bg-teal-500/10 text-teal-700 dark:text-teal-300">
                      <span className="text-[10px] font-medium">{apt.time}</span>
                      <span className="text-[9px]">{new Date(apt.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{apt.reason}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{apt.doctorName} · {apt.specialty}</p>
                    </div>
                    <AppointmentStatusBadge status={apt.status} />
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Ordonnances */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-orange-500" /> Ordonnances
              <Badge variant="secondary" className="ml-auto">{patientPrescriptions.length}</Badge>
            </h3>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {patientPrescriptions.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Aucune ordonnance</p>
              ) : (
                patientPrescriptions.slice(0, 6).map((rx) => (
                  <div key={rx.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded bg-orange-500/10 text-orange-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{rx.number} · {rx.medications.length} médicament(s)</p>
                      <p className="truncate text-[11px] text-muted-foreground">{rx.doctorName} · {formatDate(rx.date)}</p>
                    </div>
                    <Badge variant={rx.status === "active" ? "default" : "secondary"} className={rx.status === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300" : ""}>
                      {rx.status === "active" ? "Active" : "Expirée"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Factures */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Receipt className="h-4 w-4 text-emerald-600" /> Factures
              <Badge variant="secondary" className="ml-auto">{patientInvoices.length}</Badge>
            </h3>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {patientInvoices.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Aucune facture</p>
              ) : (
                patientInvoices.slice(0, 6).map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded bg-emerald-500/10 text-emerald-600">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{inv.number}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{formatDate(inv.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{formatFCFA(inv.total)}</p>
                    </div>
                    <InvoiceStatusBadge status={inv.status} />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PatientsView() {
  const [search, setSearch] = useState("");
  const [communeFilter, setCommuneFilter] = useState("tous");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [bloodFilter, setBloodFilter] = useState("tous");
  const [newOpen, setNewOpen] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = PATIENTS.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !`${p.firstName} ${p.lastName}`.toLowerCase().includes(q) &&
        !p.code.toLowerCase().includes(q) &&
        !p.phone.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (communeFilter !== "tous" && p.commune !== communeFilter) return false;
    if (statusFilter !== "tous" && p.status !== statusFilter) return false;
    if (bloodFilter !== "tous" && p.bloodType !== bloodFilter) return false;
    return true;
  });

  const openPatient = (p: Patient) => {
    setSelected(p);
    setSheetOpen(true);
  };

  const activeCount = PATIENTS.filter((p) => p.status === "actif").length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dossiers patients</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {PATIENTS.length} patients enregistrés · {activeCount} actifs · Dossier Patient Numérique (DPN)
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="bg-teal-600 text-white hover:bg-teal-700">
          <UserPlus className="mr-2 h-4 w-4" /> Nouveau patient
        </Button>
      </div>

      {/* Bandeau conformité */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
        <Shield className="h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-xs text-emerald-800 dark:text-emerald-300">
          <span className="font-semibold">Conformité Loi 2013-450 :</span> Les données médicales sont chiffrées et l'accès est tracé. Seul le personnel autorisé peut consulter le DPN.
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, code patient ou téléphone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={communeFilter} onValueChange={setCommuneFilter}>
                <SelectTrigger size="sm" className="w-[150px]">
                  <MapPin className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Commune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes les communes</SelectItem>
                  {COMMUNES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" className="w-[130px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
              <Select value={bloodFilter} onValueChange={setBloodFilter}>
                <SelectTrigger size="sm" className="w-[140px]">
                  <Droplet className="mr-1 h-3.5 w-3.5 text-rose-500" />
                  <SelectValue placeholder="Groupe sanguin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous groupes</SelectItem>
                  {BLOOD_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} patient(s) trouvé(s)</span>
            {(search || communeFilter !== "tous" || statusFilter !== "tous" || bloodFilter !== "tous") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => { setSearch(""); setCommuneFilter("tous"); setStatusFilter("tous"); setBloodFilter("tous"); }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau desktop */}
      <Card className="hidden md:block">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Liste des patients</CardTitle>
          <CardDescription>Cliquez sur un patient pour ouvrir son dossier numérique complet</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Commune</TableHead>
                  <TableHead>Dernière visite</TableHead>
                  <TableHead>Assurance</TableHead>
                  <TableHead>Groupe</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-teal-50/50 dark:hover:bg-teal-950/20"
                    onClick={() => openPatient(p)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={`${p.firstName} ${p.lastName}`} color={p.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.firstName} {p.lastName}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{p.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" /> {p.phone}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{p.commune}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.lastVisit ? formatDate(p.lastVisit) : "—"}
                    </TableCell>
                    <TableCell>
                      {p.insuranceProvider ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {p.insuranceProvider}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell><BloodTypeBadge type={p.bloodType} /></TableCell>
                    <TableCell><PatientStatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                  <Users className="h-7 w-7" />
                </div>
                <p className="mt-3 text-sm font-medium">Aucun patient trouvé</p>
                <p className="text-xs text-muted-foreground">Ajustez vos filtres de recherche.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards mobile */}
      <div className="space-y-3 md:hidden">
        {filtered.map((p) => (
          <Card key={p.id} className="cursor-pointer transition-colors hover:border-teal-300" onClick={() => openPatient(p)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={`${p.firstName} ${p.lastName}`} color={p.avatarColor} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold">{p.firstName} {p.lastName}</p>
                    <PatientStatusBadge status={p.status} />
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">{p.code}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> <span className="truncate">{p.phone}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{p.commune}</Badge>
                    <BloodTypeBadge type={p.bloodType} />
                    {p.insuranceProvider && (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {p.insuranceProvider}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
              <Users className="h-7 w-7" />
            </div>
            <p className="mt-3 text-sm font-medium">Aucun patient trouvé</p>
            <p className="text-xs text-muted-foreground">Ajustez vos filtres.</p>
          </div>
        )}
      </div>

      <NewPatientDialog open={newOpen} onOpenChange={setNewOpen} />
      <PatientDetailSheet patient={selected} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
