"use client";
import { useState } from "react";
import { toast } from "sonner";
import { PRESCRIPTIONS, PATIENTS, DOCTORS, TENANT } from "@/lib/mock-data";
import { formatDate, type Prescription, type Medication } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/medisisaas/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  FileText, Search, Filter, Plus, Printer, MessageCircle, RefreshCw,
  Pill, CheckCircle2, FileStack, CalendarClock, Trash2, Stethoscope,
  Clock, AlertCircle, Building2, User,
} from "lucide-react";

const STATUS_OPTIONS: { value: "tous" | Prescription["status"]; label: string }[] = [
  { value: "tous", label: "Tous les statuts" },
  { value: "active", label: "Actives" },
  { value: "expiree", label: "Expirées" },
  { value: "annulee", label: "Annulées" },
];

function PrescriptionStatusBadge({ status }: { status: Prescription["status"] }) {
  if (status === "active") {
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-medium">
        Active
      </Badge>
    );
  }
  if (status === "expiree") {
    return (
      <Badge variant="outline" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 font-medium">
        Expirée
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-medium">
      Annulée
    </Badge>
  );
}

function KpiCard({
  title, value, icon: Icon, accent, sub,
}: {
  title: string;
  value: string | number;
  icon: typeof Pill;
  accent: string;
  sub?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold leading-tight tracking-tight">{value}</p>
          {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
        </div>
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
      <p className="mt-3 text-sm font-medium">Aucune ordonnance</p>
      <p className="text-xs text-muted-foreground">Ajustez les filtres ou émettez une nouvelle ordonnance.</p>
    </div>
  );
}

function PrescriptionDetailDialog({
  prescription, open, onOpenChange,
}: {
  prescription: Prescription | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!prescription) return null;
  const patient = PATIENTS.find((p) => `${p.firstName} ${p.lastName}` === prescription.patientName);

  const handlePrint = () => toast.success("Impression lancée", { description: `${prescription.number} envoyée vers l'imprimante` });
  const handleWhatsApp = () => toast.success("Envoi WhatsApp", { description: `Ordonnance ${prescription.number} envoyée à ${prescription.patientName}` });
  const handleRenew = () => {
    toast.success("Renouvellement demandé", { description: "Une nouvelle ordonnance a été créée à partir de ce modèle" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" /> Ordonnance médicale
          </DialogTitle>
          <DialogDescription>
            Document officiel — Clinique du Plateau
          </DialogDescription>
        </DialogHeader>

        {/* En-tête clinique */}
        <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-4 dark:border-teal-900 dark:from-teal-950/40 dark:to-emerald-950/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{TENANT.name}</p>
                <p className="text-xs text-muted-foreground">{TENANT.address}</p>
                <p className="text-xs text-muted-foreground">{TENANT.phone} · {TENANT.email}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Numéro</p>
              <p className="font-mono text-sm font-bold text-teal-700 dark:text-teal-300">{prescription.number}</p>
              <p className="mt-1 text-xs text-muted-foreground">Émise le {formatDate(prescription.date)}</p>
            </div>
          </div>
        </div>

        {/* Patient + Médecin */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <User className="h-3 w-3" /> Patient
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Avatar name={prescription.patientName} color={patient?.avatarColor ?? "bg-teal-500"} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{prescription.patientName}</p>
                {patient && <p className="truncate text-[11px] text-muted-foreground">{patient.code} · {patient.commune}</p>}
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Stethoscope className="h-3 w-3" /> Médecin prescripteur
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{prescription.doctorName}</p>
                {(() => {
                  const doc = DOCTORS.find((d) => d.name === prescription.doctorName);
                  return doc ? <p className="truncate text-[11px] text-muted-foreground">{doc.specialty} · {doc.licenseNumber}</p> : null;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Médicaments */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Pill className="h-4 w-4 text-orange-500" /> Médicaments prescrits
            </p>
            <Badge variant="secondary">{prescription.medications.length}</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-transparent">
                <TableHead className="h-9 text-xs">Médicament</TableHead>
                <TableHead className="h-9 text-xs">Posologie</TableHead>
                <TableHead className="h-9 text-xs">Fréquence</TableHead>
                <TableHead className="h-9 text-xs">Durée</TableHead>
                <TableHead className="h-9 text-xs">Instructions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescription.medications.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="py-2 text-sm font-medium">{m.name}</TableCell>
                  <TableCell className="py-2 text-sm">{m.dosage}</TableCell>
                  <TableCell className="py-2 text-sm">{m.frequency}</TableCell>
                  <TableCell className="py-2 text-sm">{m.duration}</TableCell>
                  <TableCell className="py-2 text-xs text-muted-foreground">
                    {m.instructions ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Notes + Validité */}
        <div className="grid gap-3 sm:grid-cols-2">
          {prescription.notes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-3 w-3" /> Notes
              </p>
              <p className="mt-1.5 text-sm text-foreground">{prescription.notes}</p>
            </div>
          )}
          <div className={cn(
            "rounded-lg border p-3",
            prescription.status === "active"
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
              : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40"
          )}>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarClock className="h-3 w-3" /> Validité
            </p>
            <p className="mt-1.5 text-sm font-medium text-foreground">
              {prescription.validityDays} jours à compter de la date d&apos;émission
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Expire le {formatDate(new Date(new Date(prescription.date).getTime() + prescription.validityDays * 86400000).toISOString())}
            </p>
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-1.5 h-4 w-4" /> Imprimer
            </Button>
            <Button variant="outline" size="sm" onClick={handleWhatsApp} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
              <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
            </Button>
          </div>
          <Button size="sm" onClick={handleRenew} className="bg-teal-600 text-white hover:bg-teal-700">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Renouveler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MedForm {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

function NewPrescriptionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [meds, setMeds] = useState<MedForm[]>([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [notes, setNotes] = useState("");

  const reset = () => {
    setPatientId("");
    setDoctorId("");
    setMeds([{ name: "", dosage: "", frequency: "", duration: "" }]);
    setNotes("");
  };

  const addMed = () => setMeds([...meds, { name: "", dosage: "", frequency: "", duration: "" }]);
  const removeMed = (i: number) => setMeds(meds.filter((_, idx) => idx !== i));
  const updateMed = (i: number, field: keyof MedForm, value: string) => {
    setMeds(meds.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  };

  const handleSubmit = () => {
    if (!patientId || !doctorId) {
      toast.error("Champs manquants", { description: "Veuillez sélectionner le patient et le médecin." });
      return;
    }
    const validMeds = meds.filter((m) => m.name.trim() !== "");
    if (validMeds.length === 0) {
      toast.error("Aucun médicament", { description: "Ajoutez au moins un médicament à l'ordonnance." });
      return;
    }
    const patient = PATIENTS.find((p) => p.id === patientId);
    const doctor = DOCTORS.find((d) => d.id === doctorId);
    toast.success("Ordonnance émise", {
      description: `${validMeds.length} médicament(s) · ${patient?.firstName} ${patient?.lastName} · ${doctor?.name}`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-teal-600" /> Nouvelle ordonnance
          </DialogTitle>
          <DialogDescription>
            Émettre une ordonnance électronique pour un patient de la Clinique du Plateau.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Patient + Médecin */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="rx-patient">Patient *</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger id="rx-patient" className="w-full">
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
              <Label htmlFor="rx-doctor">Médecin prescripteur *</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger id="rx-doctor" className="w-full">
                  <SelectValue placeholder="Sélectionner un médecin" />
                </SelectTrigger>
                <SelectContent>
                  {DOCTORS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} <span className="text-muted-foreground">· {d.specialty}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Médicaments */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-orange-500" /> Médicaments
              </Label>
              <Button type="button" size="sm" variant="outline" onClick={addMed} className="h-7 border-teal-200 text-teal-700 hover:bg-teal-50">
                <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un médicament
              </Button>
            </div>

            <div className="space-y-2">
              {meds.map((m, i) => (
                <div key={i} className="rounded-lg border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/10 text-[10px] font-bold text-teal-700">{i + 1}</span>
                      Médicament
                    </span>
                    {meds.length > 1 && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeMed(i)} className="h-7 px-2 text-rose-600 hover:bg-rose-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="Nom du médicament *" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
                    <Input placeholder="Posologie (ex. 1 comprimé)" value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} />
                    <Input placeholder="Fréquence (ex. 3 fois par jour)" value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} />
                    <Input placeholder="Durée (ex. 7 jours)" value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="rx-notes">Notes / Instructions générales</Label>
            <Textarea
              id="rx-notes"
              placeholder="Ex. Renouvelable une fois. À prendre avec un grand verre d'eau."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Validité */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 text-teal-600" />
            <span>Validité par défaut : <span className="font-semibold text-foreground">30 jours</span> à compter de la date d&apos;émission.</span>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleSubmit} className="bg-teal-600 text-white hover:bg-teal-700">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Émettre l&apos;ordonnance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PrescriptionsView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const [doctorFilter, setDoctorFilter] = useState<string>("tous");
  const [detail, setDetail] = useState<Prescription | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const activeCount = PRESCRIPTIONS.filter((p) => p.status === "active").length;
  const expiredCount = PRESCRIPTIONS.filter((p) => p.status === "expiree").length;
  const totalCount = PRESCRIPTIONS.length;
  const avgValidity = Math.round(PRESCRIPTIONS.reduce((s, p) => s + p.validityDays, 0) / PRESCRIPTIONS.length);

  const selectedDoctor = DOCTORS.find((d) => d.id === doctorFilter);

  const filtered = PRESCRIPTIONS.filter((p) => {
    if (statusFilter !== "tous" && p.status !== statusFilter) return false;
    if (selectedDoctor && p.doctorName !== selectedDoctor.name) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.number.toLowerCase().includes(q) && !p.patientName.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const openDetail = (rx: Prescription) => {
    setDetail(rx);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ordonnances</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-emerald-600">{activeCount} actives</span> · {expiredCount} expirées · Clinique du Plateau
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="bg-teal-600 text-white hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle ordonnance
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Ordonnances actives" value={activeCount} icon={CheckCircle2} accent="bg-emerald-600" sub="En cours de validité" />
        <KpiCard title="Expirées" value={expiredCount} icon={AlertCircle} accent="bg-zinc-500" sub="À renouveler si besoin" />
        <KpiCard title="Total émises" value={totalCount} icon={FileStack} accent="bg-teal-600" sub="Toutes confondues" />
        <KpiCard title="Validité moyenne" value={`${avgValidity} j`} icon={CalendarClock} accent="bg-orange-500" sub="Durée standard" />
      </div>

      {/* Filtres + Tableau */}
      <Card>
        <CardContent className="p-4 space-y-4">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" className="w-[170px]">
                  <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger size="sm" className="w-[220px]">
                  <SelectValue placeholder="Médecin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les médecins</SelectItem>
                  {DOCTORS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
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
                    <TableHead className="text-xs">Numéro</TableHead>
                    <TableHead className="text-xs">Patient</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Médecin</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-xs text-center">Méd.</TableHead>
                    <TableHead className="text-xs text-right">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((rx) => {
                    const patient = PATIENTS.find((p) => `${p.firstName} ${p.lastName}` === rx.patientName);
                    return (
                      <TableRow
                        key={rx.id}
                        className="cursor-pointer transition-colors hover:bg-teal-50/60 dark:hover:bg-teal-950/20"
                        onClick={() => openDetail(rx)}
                      >
                        <TableCell className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-300">
                          {rx.number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar name={rx.patientName} color={patient?.avatarColor ?? "bg-teal-500"} size="sm" />
                            <span className="text-sm font-medium">{rx.patientName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{rx.doctorName}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(rx.date)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono">{rx.medications.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <PrescriptionStatusBadge status={rx.status} />
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

      <PrescriptionDetailDialog prescription={detail} open={detailOpen} onOpenChange={setDetailOpen} />
      <NewPrescriptionDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
